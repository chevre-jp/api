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
    async (req, res, next) => {
        try {
            const actionRepo = new chevre.repository.Action(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);

            const doc = await actionRepo.actionModel.findById(req.params.id)
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound('Action');
            }

            const action = <chevre.factory.action.IAction<chevre.factory.action.IAttributes<any, any, any>>>doc.toObject();
            await actionRepo.cancel({ typeOf: action.typeOf, id: action.id });

            // 予約使用アクションであれば、イベント再集計
            if (action.typeOf === chevre.factory.actionType.UseAction
                && Array.isArray(action.object)
                && typeof action.object[0]?.reservationFor?.id === 'string') {
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
                await taskRepo.save(aggregateTask);
            }

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default actionsRouter;
