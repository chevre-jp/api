/**
 * 返金取引ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body } from 'express-validator';
import { NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

const refundTransactionsRouter = Router();

import * as redis from '../../../redis';

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

refundTransactionsRouter.use(authentication);

refundTransactionsRouter.post(
    '/start',
    permitScopes(['admin']),
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
            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const sellerRepo = new chevre.repository.Seller(mongoose.connection);
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);

            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: chevre.factory.organizationType.Project };

            const transaction = await chevre.service.transaction.refund.start({
                project: project,
                typeOf: chevre.factory.transactionType.Refund,
                agent: {
                    ...req.body.agent
                },
                object: req.body.object,
                recipient: {
                    ...req.body.recipient
                },
                expires: req.body.expires,
                transactionNumber: req.body.transactionNumber
            })({
                project: projectRepo,
                seller: sellerRepo,
                transaction: transactionRepo
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
refundTransactionsRouter.put<ParamsDictionary>(
    '/:transactionId/confirm',
    permitScopes(['admin', 'transactions']),
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
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);

            await chevre.service.transaction.refund.confirm({
                ...req.body,
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            })({ transaction: transactionRepo });

            // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
            // tslint:disable-next-line:no-floating-promises
            chevre.service.transaction.exportTasks({
                status: chevre.factory.transactionStatusType.Confirmed,
                typeOf: { $in: [chevre.factory.transactionType.Refund] }
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

refundTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes(['admin', 'transactions']),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            await chevre.service.transaction.refund.cancel({
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

export default refundTransactionsRouter;
