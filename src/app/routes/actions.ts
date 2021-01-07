/**
 * アクションルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { query } from 'express-validator';
import { NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const actionsRouter = Router();
actionsRouter.use(authentication);

/**
 * アクション検索
 */
actionsRouter.get(
    '',
    permitScopes(['admin']),
    ...[
        query('limit')
            .optional()
            .isInt()
            .toInt(),
        query('page')
            .optional()
            .isInt()
            .toInt(),
        query('startFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('startThrough')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const actionRepo = new chevre.repository.Action(mongoose.connection);

            const searchConditions: chevre.factory.action.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const actions = await actionRepo.search(searchConditions);

            res.json(actions);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * アクションを取消
 */
actionsRouter.put(
    `/:id/${chevre.factory.actionStatusType.CanceledActionStatus}`,
    permitScopes(['admin']),
    validator,
    // tslint:disable-next-line:max-func-body-length
    async (req, res, next) => {
        try {
            const actionRepo = new chevre.repository.Action(mongoose.connection);
            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);

            const doc = await actionRepo.actionModel.findById(req.params.id)
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound('Action');
            }

            let action = <chevre.factory.action.IAction<chevre.factory.action.IAttributes<any, any, any>>>doc.toObject();

            const project = await projectRepo.findById({ id: action.project.id });

            action = await actionRepo.cancel({ typeOf: action.typeOf, id: action.id });

            // 予約使用アクションであれば、イベント再集計
            if (action.typeOf === chevre.factory.actionType.UseAction
                && Array.isArray(action.object)
                && typeof action.object[0]?.reservationFor?.id === 'string') {
                const reservation = action.object[0];

                try {
                    // 予約のuseActionExistsを調整
                    const useReservationActions = await actionRepo.search({
                        limit: 1,
                        actionStatus: { $in: [chevre.factory.actionStatusType.CompletedActionStatus] },
                        typeOf: { $eq: chevre.factory.actionType.UseAction },
                        object: {
                            // 予約タイプ
                            typeOf: { $eq: chevre.factory.reservationType.EventReservation },
                            // 予約ID
                            ...{
                                id: { $eq: reservation.id }
                            }
                        }
                    });
                    if (useReservationActions.length === 0) {
                        await reservationRepo.reservationModel.findByIdAndUpdate(
                            reservation.id,
                            {
                                $set: { useActionExists: false },
                                $unset: { 'reservedTicket.dateUsed': 1 }
                            }
                        )
                            .exec();
                    }
                } catch (error) {
                    console.error('set useActionExists:false failed.', error);
                }

                const tasks: chevre.factory.task.IAttributes[] = [];

                // アクション通知タスク作成
                const informAction = (<any>project).settings?.onActionStatusChanged?.informAction;
                if (Array.isArray(informAction)) {
                    informAction.forEach((informParams) => {
                        const triggerWebhookTask: chevre.factory.task.triggerWebhook.IAttributes = {
                            project: action.project,
                            name: chevre.factory.taskName.TriggerWebhook,
                            status: chevre.factory.taskStatus.Ready,
                            runsAt: new Date(),
                            remainingNumberOfTries: 3,
                            numberOfTried: 0,
                            executionResults: [],
                            data: {
                                project: action.project,
                                typeOf: chevre.factory.actionType.InformAction,
                                agent: action.project,
                                recipient: {
                                    typeOf: 'Person',
                                    ...informParams.recipient
                                },
                                object: action
                            }
                        };
                        tasks.push(triggerWebhookTask);
                    });
                }

                const aggregateTask: chevre.factory.task.aggregateScreeningEvent.IAttributes = {
                    project: action.project,
                    name: chevre.factory.taskName.AggregateScreeningEvent,
                    status: chevre.factory.taskStatus.Ready,
                    runsAt: new Date(),
                    remainingNumberOfTries: 3,
                    numberOfTried: 0,
                    executionResults: [],
                    data: {
                        typeOf: action.object[0].reservationFor.typeOf,
                        id: action.object[0].reservationFor.id
                    }
                };
                tasks.push(aggregateTask);

                if (tasks.length > 0) {
                    await taskRepo.saveMany(tasks);
                }
            }

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default actionsRouter;
