/**
 * 決済取引ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body } from 'express-validator';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

const payTransactionsRouter = Router();

import * as redis from '../../../redis';

import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

/**
 * 決済認証(ムビチケ購入番号確認)
 */
payTransactionsRouter.post(
    '/check',
    permitScopes([]),
    validator,
    async (req, res, next) => {
        try {
            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: chevre.factory.organizationType.Project };

            const action = await chevre.service.transaction.pay.check({
                project: project,
                typeOf: chevre.factory.actionType.CheckAction,
                agent: {
                    ...req.body.agent
                },
                object: req.body.object,
                recipient: {
                    ...req.body.recipient
                }
            })({
                action: new chevre.repository.Action(mongoose.connection),
                event: new chevre.repository.Event(mongoose.connection),
                product: new chevre.repository.Product(mongoose.connection),
                project: new chevre.repository.Project(mongoose.connection),
                seller: new chevre.repository.Seller(mongoose.connection)
            });

            res.status(CREATED)
                .json(action);
        } catch (error) {
            next(error);
        }
    }
);

payTransactionsRouter.post(
    '/start',
    permitScopes([]),
    ...[
        body('project')
            .not()
            .isEmpty()
            .withMessage('Required'),
        body('expires')
            .not()
            .isEmpty()
            .withMessage('Required')
            .isISO8601()
            .toDate(),
        body('transactionNumber')
            .not()
            .isEmpty()
            .withMessage('Required')
            .isString(),
        body('agent')
            .not()
            .isEmpty()
            .withMessage('Required'),
        body('agent.typeOf')
            .not()
            .isEmpty()
            .withMessage('Required'),
        body('agent.name')
            .not()
            .isEmpty()
            .withMessage('Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const accountRepo = new chevre.repository.Account(mongoose.connection);
            const actionRepo = new chevre.repository.Action(mongoose.connection);
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const productRepo = new chevre.repository.Product(mongoose.connection);
            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const sellerRepo = new chevre.repository.Seller(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);

            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: chevre.factory.organizationType.Project };

            const transaction = await chevre.service.transaction.pay.start({
                project: project,
                typeOf: chevre.factory.assetTransactionType.Pay,
                agent: {
                    ...req.body.agent
                },
                object: req.body.object,
                recipient: {
                    ...req.body.recipient
                },
                expires: req.body.expires,
                ...(typeof req.body.transactionNumber === 'string') ? { transactionNumber: req.body.transactionNumber } : undefined,
                ...(req.body.purpose !== undefined && req.body.purpose !== null) ? { purpose: req.body.purpose } : undefined
            })({
                account: accountRepo,
                action: actionRepo,
                event: eventRepo,
                product: productRepo,
                project: projectRepo,
                seller: sellerRepo,
                transaction: transactionRepo,
                task: taskRepo
            });

            res.json(transaction);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 取引確定
 */
// tslint:disable-next-line:use-default-type-parameter
payTransactionsRouter.put<ParamsDictionary>(
    '/:transactionId/confirm',
    permitScopes(['transactions']),
    ...[
        body('endDate')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);

            await chevre.service.transaction.pay.confirm({
                ...req.body,
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            })({ transaction: transactionRepo });

            // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
            // tslint:disable-next-line:no-floating-promises
            chevre.service.transaction.exportTasks({
                status: chevre.factory.transactionStatusType.Confirmed,
                typeOf: { $in: [chevre.factory.assetTransactionType.Pay] }
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

payTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes(['transactions']),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
            await chevre.service.transaction.pay.cancel({
                ...req.body,
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            })({
                transaction: transactionRepo
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default payTransactionsRouter;
