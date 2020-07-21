/**
 * 通貨転送取引ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { body } from 'express-validator';
import { NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

const moneyTransferTransactionsRouter = Router();

import * as redis from '../../../redis';

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

moneyTransferTransactionsRouter.use(authentication);

moneyTransferTransactionsRouter.post(
    '/start',
    permitScopes(['admin']),
    ...[
        body('project')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('expires')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required')
            .isISO8601()
            .toDate(),
        body('agent.typeOf')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('agent.name')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('recipient.typeOf')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('recipient.name')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const serviceOutputRepo = new chevre.repository.ServiceOutput(mongoose.connection);
            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            const transactionNumberRepo = new chevre.repository.TransactionNumber(redis.getClient());

            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: 'Project' };

            const transaction = await chevre.service.transaction.moneyTransfer.start({
                typeOf: chevre.factory.transactionType.MoneyTransfer,
                project: project,
                agent: req.body.agent,
                object: req.body.object,
                recipient: req.body.recipient,
                expires: moment(req.body.expires)
                    .toDate(),
                ...(typeof req.body.transactionNumber === 'string') ? { transactionNumber: req.body.transactionNumber } : undefined
            })({
                project: projectRepo,
                serviceOutput: serviceOutputRepo,
                transaction: transactionRepo,
                transactionNumber: transactionNumberRepo
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
moneyTransferTransactionsRouter.put(
    '/:transactionId/confirm',
    permitScopes(['admin', 'transactions']),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);

            await chevre.service.transaction.moneyTransfer.confirm({
                ...req.body,
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            })({ transaction: transactionRepo });

            // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
            // tslint:disable-next-line:no-floating-promises
            chevre.service.transaction.exportTasks({
                status: chevre.factory.transactionStatusType.Confirmed,
                typeOf: chevre.factory.transactionType.MoneyTransfer
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

moneyTransferTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes(['admin', 'transactions']),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            await chevre.service.transaction.moneyTransfer.cancel({
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

export default moneyTransferTransactionsRouter;
