/**
 * サービス登録取引ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

const registerServiceTransactionsRouter = Router();

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

registerServiceTransactionsRouter.use(authentication);

registerServiceTransactionsRouter.post(
    '/start',
    permitScopes(['admin']),
    (req, _, next) => {
        req.checkBody('project')
            .notEmpty()
            .withMessage('Required');
        req.checkBody('expires', 'invalid expires')
            .notEmpty()
            .withMessage('Required')
            .isISO8601();
        req.checkBody('agent', 'invalid agent')
            .notEmpty()
            .withMessage('Required');
        req.checkBody('agent.typeOf', 'invalid agent.typeOf')
            .notEmpty()
            .withMessage('Required');
        req.checkBody('agent.name', 'invalid agent.name')
            .notEmpty()
            .withMessage('Required');

        next();
    },
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
                expires: moment(req.body.expires)
                    .toDate(),
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
registerServiceTransactionsRouter.put(
    '/:transactionId/confirm',
    permitScopes(['admin', 'transactions']),
    validator,
    async (req, res, next) => {
        try {
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            await chevre.service.transaction.registerService.confirm({
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

registerServiceTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes(['admin', 'transactions']),
    validator,
    async (req, res, next) => {
        try {
            const actionRepo = new chevre.repository.Action(mongoose.connection);
            const serviceOutputRepo = new chevre.repository.ServiceOutput(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            await chevre.service.transaction.registerService.cancel({
                ...req.body,
                id: req.params.transactionId
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
