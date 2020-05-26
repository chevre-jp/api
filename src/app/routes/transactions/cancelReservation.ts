/**
 * 予約キャンセル取引ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

const cancelReservationTransactionsRouter = Router();

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

cancelReservationTransactionsRouter.use(authentication);

cancelReservationTransactionsRouter.post(
    '/start',
    permitScopes(['admin', 'transactions']),
    (req, _, next) => {
        req.checkBody('project')
            .notEmpty()
            .withMessage('required');
        req.checkBody('expires')
            .notEmpty()
            .withMessage('required')
            .isISO8601();
        req.checkBody('agent')
            .notEmpty()
            .withMessage('required');
        req.checkBody('agent.typeOf')
            .notEmpty()
            .withMessage('required');
        req.checkBody('agent.name')
            .notEmpty()
            .withMessage('required');

        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);

            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: 'Project' };

            const transaction = await chevre.service.transaction.cancelReservation.start({
                project: project,
                typeOf: chevre.factory.transactionType.CancelReservation,
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
    permitScopes(['admin', 'transactions']),
    (req, _, next) => {
        req.checkBody('project')
            .notEmpty()
            .withMessage('required');
        req.checkBody('expires')
            .notEmpty()
            .withMessage('required')
            .isISO8601();
        req.checkBody('agent')
            .notEmpty()
            .withMessage('required');
        req.checkBody('agent.typeOf')
            .notEmpty()
            .withMessage('required');
        req.checkBody('agent.name')
            .notEmpty()
            .withMessage('required');

        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);

            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: 'Project' };

            await chevre.service.transaction.cancelReservation.startAndConfirm({
                project: project,
                typeOf: chevre.factory.transactionType.CancelReservation,
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

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

cancelReservationTransactionsRouter.put(
    '/:transactionId/confirm',
    permitScopes(['admin', 'transactions']),
    validator,
    async (req, res, next) => {
        try {
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            await chevre.service.transaction.cancelReservation.confirm({
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

cancelReservationTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes(['admin', 'transactions']),
    validator,
    async (req, res, next) => {
        try {
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            await transactionRepo.cancel({
                typeOf: chevre.factory.transactionType.CancelReservation,
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
