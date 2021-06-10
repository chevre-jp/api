/**
 * サービス登録取引ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body } from 'express-validator';
import { NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

const registerServiceTransactionsRouter = Router();

import * as redis from '../../../redis';

import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

registerServiceTransactionsRouter.post(
    '/start',
    permitScopes(['assetTransactions.write']),
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
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
            const productRepo = new chevre.repository.Product(mongoose.connection);
            const serviceOutputRepo = new chevre.repository.ServiceOutput(mongoose.connection);
            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);

            const project: chevre.factory.project.IProject = { id: req.project.id, typeOf: chevre.factory.organizationType.Project };

            const transaction = await chevre.service.transaction.registerService.start({
                project: project,
                typeOf: chevre.factory.assetTransactionType.RegisterService,
                agent: {
                    ...req.body.agent
                    // id: (req.body.agent.id !== undefined) ? req.body.agent.id : req.user.sub,
                },
                object: req.body.object,
                expires: req.body.expires,
                ...(typeof req.body.transactionNumber === 'string') ? { transactionNumber: req.body.transactionNumber } : undefined
            })({
                account: accountRepo,
                offer: offerRepo,
                offerCatalog: offerCatalogRepo,
                product: productRepo,
                serviceOutput: serviceOutputRepo,
                project: projectRepo,
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
registerServiceTransactionsRouter.put<ParamsDictionary>(
    '/:transactionId/confirm',
    permitScopes(['assetTransactions.write']),
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

            await chevre.service.transaction.registerService.confirm({
                ...req.body,
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            })({ transaction: transactionRepo });

            // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
            // tslint:disable-next-line:no-floating-promises
            chevre.service.transaction.exportTasks({
                status: chevre.factory.transactionStatusType.Confirmed,
                typeOf: { $in: [chevre.factory.assetTransactionType.RegisterService] }
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

registerServiceTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes(['assetTransactions.write']),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
            await chevre.service.transaction.registerService.cancel({
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

export default registerServiceTransactionsRouter;
