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
            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const transactionNumberRepo = new chevre.repository.TransactionNumber(redis.getClient());
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const placeRepo = new chevre.repository.Place(mongoose.connection);
            const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
            const eventAvailabilityRepo = new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient());
            const offerRateLimitRepo = new chevre.repository.rateLimit.Offer(redis.getClient());
            const productRepo = new chevre.repository.Product(mongoose.connection);
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);

            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: 'Project' };

            const transaction = await chevre.service.transaction.reserve.start({
                project: project,
                typeOf: chevre.factory.transactionType.Reserve,
                agent: req.body.agent,
                object: req.body.object,
                expires: moment(req.body.expires)
                    .toDate(),
                ...(typeof req.body.transactionNumber === 'string') ? { transactionNumber: req.body.transactionNumber } : undefined
            })({
                project: projectRepo,
                eventAvailability: eventAvailabilityRepo,
                event: eventRepo,
                offer: offerRepo,
                offerCatalog: offerCatalogRepo,
                offerRateLimit: offerRateLimitRepo,
                place: placeRepo,
                priceSpecification: priceSpecificationRepo,
                product: productRepo,
                reservation: reservationRepo,
                task: taskRepo,
                transaction: transactionRepo,
                transactionNumber: transactionNumberRepo
            });

            // レスポンスデータ量が大きくて不要な場合、受け取らない選択ができるように
            if (req.query.expectsNoContent === '1') {
                res.status(NO_CONTENT)
                    .end();
            } else {
                res.json(transaction);
            }
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
            const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
            const eventAvailabilityRepo = new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient());
            const offerRateLimitRepo = new chevre.repository.rateLimit.Offer(redis.getClient());
            const productRepo = new chevre.repository.Product(mongoose.connection);
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
                offerCatalog: offerCatalogRepo,
                offerRateLimit: offerRateLimitRepo,
                place: placeRepo,
                priceSpecification: priceSpecificationRepo,
                product: productRepo,
                reservation: reservationRepo,
                task: taskRepo,
                transaction: transactionRepo
            });

            // レスポンスデータ量が大きくて不要な場合、受け取らない選択ができるように
            if (req.query.expectsNoContent === '1') {
                res.status(NO_CONTENT)
                    .end();
            } else {
                res.json(transaction);
            }
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
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
            await chevre.service.transaction.reserve.confirm({
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

reserveTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes(['admin', 'transactions']),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            const actionRepo = new chevre.repository.Action(mongoose.connection);
            const eventAvailabilityRepo = new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient());
            const offerRateLimitRepo = new chevre.repository.rateLimit.Offer(redis.getClient());
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);

            await chevre.service.transaction.reserve.cancel({
                ...req.body,
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            })({
                action: actionRepo,
                eventAvailability: eventAvailabilityRepo,
                offerRateLimit: offerRateLimitRepo,
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
