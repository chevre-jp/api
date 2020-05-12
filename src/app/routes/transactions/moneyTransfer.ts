/**
 * 通貨転送取引ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body } from 'express-validator/check';
import { NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

const moneyTransferTransactionsRouter = Router();

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

            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: 'Project' };

            const transaction = await chevre.service.transaction.moneyTransfer.start({
                project: project,
                agent: {
                    ...req.body.agent
                },
                object: {
                    ...req.body.object
                },
                recipient: {
                    ...req.body.recipient
                },
                expires: moment(req.body.expires)
                    .toDate()
            })({
                project: projectRepo,
                serviceOutput: serviceOutputRepo,
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
moneyTransferTransactionsRouter.put(
    '/:transactionId/confirm',
    permitScopes(['admin', 'transactions']),
    validator,
    async (req, res, next) => {
        try {
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            await chevre.service.transaction.moneyTransfer.confirm({
                ...req.body,
                id: req.params.transactionId
            })({ transaction: transactionRepo });

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
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            await chevre.service.transaction.moneyTransfer.cancel({
                ...req.body,
                id: req.params.transactionId
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