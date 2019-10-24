/**
 * 予約取引ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

const reserveTransactionsRouter = Router();

import * as redis from '../../../redis';
import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

reserveTransactionsRouter.use(authentication);

reserveTransactionsRouter.post(
    '/start',
    permitScopes(['admin', 'transactions']),
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
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            const reservationNumberRepo = new chevre.repository.ReservationNumber(redis.getClient());

            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: 'Project' };

            const transaction = await chevre.service.transaction.reserve.start({
                project: project,
                typeOf: chevre.factory.transactionType.Reserve,
                agent: {
                    typeOf: req.body.agent.typeOf,
                    // id: (req.body.agent.id !== undefined) ? req.body.agent.id : req.user.sub,
                    name: req.body.agent.name,
                    url: req.body.agent.url
                },
                object: {
                    ...req.body.object
                },
                expires: moment(req.body.expires)
                    .toDate()
            })({
                reservationNumber: reservationNumberRepo,
                transaction: transactionRepo
            });
            res.json(transaction);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 予約追加
 */
reserveTransactionsRouter.post(
    '/:transactionId/reservations',
    permitScopes(['admin', 'transactions']),
    validator,
    async (req, res, next) => {
        try {
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const placeRepo = new chevre.repository.Place(mongoose.connection);
            const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const eventAvailabilityRepo = new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient());
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);

            const transaction = await chevre.service.transaction.reserve.addReservations({
                id: req.params.transactionId,
                object: {
                    event: req.body.object.event,
                    acceptedOffer: req.body.object.acceptedOffer
                }
            })({
                eventAvailability: eventAvailabilityRepo,
                event: eventRepo,
                offer: offerRepo,
                place: placeRepo,
                priceSpecification: priceSpecificationRepo,
                reservation: reservationRepo,
                task: taskRepo,
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
reserveTransactionsRouter.put(
    '/:transactionId/confirm',
    permitScopes(['admin', 'transactions']),
    validator,
    async (req, res, next) => {
        try {
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            await chevre.service.transaction.reserve.confirm({
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

reserveTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes(['admin', 'transactions']),
    validator,
    async (req, res, next) => {
        try {
            const actionRepo = new chevre.repository.Action(mongoose.connection);
            const eventAvailabilityRepo = new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient());
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            await chevre.service.transaction.reserve.cancel({
                id: req.params.transactionId
            })({
                action: actionRepo,
                eventAvailability: eventAvailabilityRepo,
                reservation: reservationRepo,
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

export default reserveTransactionsRouter;
