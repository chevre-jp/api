/**
 * 予約キャンセル取引ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { body } from 'express-validator';
import { NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

const cancelReservationTransactionsRouter = Router();

import * as redis from '../../../redis';

import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

cancelReservationTransactionsRouter.post(
    '/start',
    permitScopes(['assetTransactions.write', 'transactions']),
    ...[
        body('project')
            .not()
            .isEmpty()
            .withMessage('required'),
        body('expires')
            .not()
            .isEmpty()
            .withMessage('required')
            .isISO8601(),
        body('agent')
            .not()
            .isEmpty()
            .withMessage('required'),
        body('agent.typeOf')
            .not()
            .isEmpty()
            .withMessage('required'),
        body('agent.name')
            .not()
            .isEmpty()
            .withMessage('required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);

            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: chevre.factory.organizationType.Project };

            const transaction = await chevre.service.transaction.cancelReservation.start({
                project: project,
                typeOf: chevre.factory.assetTransactionType.CancelReservation,
                agent: {
                    ...req.body.agent
                    // id: (req.body.agent.id !== undefined) ? req.body.agent.id : req.user.sub,
                },
                object: {
                    clientUser: req.user,
                    ...req.body.object
                },
                expires: moment(req.body.expires)
                    .toDate(),
                ...(typeof req.body.transactionNumber === 'string') ? { transactionNumber: req.body.transactionNumber } : undefined
            })({
                project: projectRepo,
                reservation: reservationRepo,
                transaction: transactionRepo
            });
            res.json(transaction);
        } catch (error) {
            next(error);
        }
    }
);

cancelReservationTransactionsRouter.post(
    '/confirm',
    permitScopes(['assetTransactions.write', 'transactions']),
    ...[
        body('project')
            .not()
            .isEmpty()
            .withMessage('required'),
        body('expires')
            .not()
            .isEmpty()
            .withMessage('required')
            .isISO8601(),
        body('agent')
            .not()
            .isEmpty()
            .withMessage('required'),
        body('agent.typeOf')
            .not()
            .isEmpty()
            .withMessage('required'),
        body('agent.name')
            .not()
            .isEmpty()
            .withMessage('required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);

            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: chevre.factory.organizationType.Project };

            await chevre.service.transaction.cancelReservation.startAndConfirm({
                project: project,
                typeOf: chevre.factory.assetTransactionType.CancelReservation,
                agent: {
                    ...req.body.agent
                    // id: (req.body.agent.id !== undefined) ? req.body.agent.id : req.user.sub,
                },
                object: {
                    clientUser: req.user,
                    ...req.body.object
                },
                expires: moment(req.body.expires)
                    .toDate(),
                potentialActions: {
                    ...req.body.potentialActions
                },
                ...(typeof req.body.transactionNumber === 'string') ? { transactionNumber: req.body.transactionNumber } : undefined
            })({
                project: projectRepo,
                reservation: reservationRepo,
                transaction: transactionRepo
            });

            // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
            // tslint:disable-next-line:no-floating-promises
            chevre.service.transaction.exportTasks({
                status: chevre.factory.transactionStatusType.Confirmed,
                typeOf: { $in: [chevre.factory.assetTransactionType.CancelReservation] }
            })({
                project: projectRepo,
                task: taskRepo,
                transaction: transactionRepo
            })
                .then(async (tasks) => {
                    // タスクがあればすべて実行
                    if (Array.isArray(tasks)) {
                        await Promise.all(tasks.map(async (task) => {
                            await chevre.service.task.executeByName({ name: task.name })({
                                connection: mongoose.connection,
                                redisClient: redis.getClient()
                            });
                        }));
                    }
                });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

cancelReservationTransactionsRouter.put(
    '/:transactionId/confirm',
    permitScopes(['assetTransactions.write', 'transactions']),
    validator,
    async (req, res, next) => {
        try {
            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);

            await chevre.service.transaction.cancelReservation.confirm({
                ...req.body,
                id: req.params.transactionId
            })({ transaction: transactionRepo });

            // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
            // tslint:disable-next-line:no-floating-promises
            chevre.service.transaction.exportTasks({
                status: chevre.factory.transactionStatusType.Confirmed,
                typeOf: { $in: [chevre.factory.assetTransactionType.CancelReservation] }
            })({
                project: projectRepo,
                task: taskRepo,
                transaction: transactionRepo
            })
                .then(async (tasks) => {
                    // タスクがあればすべて実行
                    if (Array.isArray(tasks)) {
                        await Promise.all(tasks.map(async (task) => {
                            await chevre.service.task.executeByName({ name: task.name })({
                                connection: mongoose.connection,
                                redisClient: redis.getClient()
                            });
                        }));
                    }
                });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

cancelReservationTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes(['assetTransactions.write', 'transactions']),
    validator,
    async (req, res, next) => {
        try {
            const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
            await transactionRepo.cancel({
                typeOf: chevre.factory.assetTransactionType.CancelReservation,
                id: req.params.transactionId
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default cancelReservationTransactionsRouter;
