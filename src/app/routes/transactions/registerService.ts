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

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

registerServiceTransactionsRouter.use(authentication);

registerServiceTransactionsRouter.post(
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
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
            const productRepo = new chevre.repository.Product(mongoose.connection);
            const serviceOutputRepo = new chevre.repository.ServiceOutput(mongoose.connection);
            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);

            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: 'Project' };

            const transaction = await chevre.service.transaction.registerService.start({
                project: project,
                typeOf: chevre.factory.transactionType.RegisterService,
                agent: {
                    ...req.body.agent
                    // id: (req.body.agent.id !== undefined) ? req.body.agent.id : req.user.sub,
                },
                object: req.body.object,
                expires: req.body.expires,
                ...(typeof req.body.transactionNumber === 'string') ? { transactionNumber: req.body.transactionNumber } : undefined
            })({
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
            await chevre.service.transaction.registerService.confirm({
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

registerServiceTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes(['admin', 'transactions']),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            const actionRepo = new chevre.repository.Action(mongoose.connection);
            const serviceOutputRepo = new chevre.repository.ServiceOutput(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            await chevre.service.transaction.registerService.cancel({
                ...req.body,
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            })({
                action: actionRepo,
                serviceOutput: serviceOutputRepo,
                task: taskRepo,
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
