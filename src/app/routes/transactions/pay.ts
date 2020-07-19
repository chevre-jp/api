/**
 * 決済取引ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body } from 'express-validator';
import { NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

const payTransactionsRouter = Router();

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

payTransactionsRouter.use(authentication);

payTransactionsRouter.post(
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
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const sellerRepo = new chevre.repository.Seller(mongoose.connection);
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);

            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: 'Project' };

            const transaction = await chevre.service.transaction.pay.start({
                project: project,
                typeOf: chevre.factory.transactionType.Pay,
                agent: {
                    ...req.body.agent
                },
                object: req.body.object,
                recipient: {
                    ...req.body.recipient
                },
                expires: req.body.expires,
                ...(typeof req.body.transactionNumber === 'string') ? { transactionNumber: req.body.transactionNumber } : undefined
            })({
                event: eventRepo,
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
payTransactionsRouter.put<ParamsDictionary>(
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

            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            await chevre.service.transaction.pay.confirm({
                ...req.body,
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            })({ transaction: transactionRepo });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

payTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes(['admin', 'transactions']),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
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
