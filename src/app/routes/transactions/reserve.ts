/**
 * 予約取引ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { body } from 'express-validator';
import { NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

const reserveTransactionsRouter = Router();

import * as redis from '../../../redis';

import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

reserveTransactionsRouter.post(
    '/start',
    permitScopes(['assetTransactions.write']),
    ...[
        body('project')
            .not()
            .isEmpty()
            .withMessage('Required'),
        body('expires', 'invalid expires')
            .not()
            .isEmpty()
            .withMessage('Required')
            .isISO8601(),
        body('agent', 'invalid agent')
            .not()
            .isEmpty()
            .withMessage('Required'),
        body('agent.typeOf', 'invalid agent.typeOf')
            .not()
            .isEmpty()
            .withMessage('Required'),
        body('agent.name', 'invalid agent.name')
            .not()
            .isEmpty()
            .withMessage('Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const transactionNumberRepo = new chevre.repository.TransactionNumber(redis.getClient());
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const placeRepo = new chevre.repository.Place(mongoose.connection);
            const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
            const eventAvailabilityRepo = new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient());
            const offerRateLimitRepo = new chevre.repository.rateLimit.Offer(redis.getClient());
            const productRepo = new chevre.repository.Product(mongoose.connection);
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
            const serviceOutputRepo = new chevre.repository.ServiceOutput(mongoose.connection);

            const project: chevre.factory.project.IProject = { id: req.project.id, typeOf: chevre.factory.organizationType.Project };

            const transaction = await chevre.service.transaction.reserve.start({
                project: project,
                typeOf: chevre.factory.assetTransactionType.Reserve,
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
                serviceOutput: serviceOutputRepo,
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
// reserveTransactionsRouter.post(
//     '/:transactionId/reservations',
//     permitScopes([]),
//     validator,
//     async (req, res, next) => {
//         try {
//             const eventRepo = new chevre.repository.Event(mongoose.connection);
//             const placeRepo = new chevre.repository.Place(mongoose.connection);
//             const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
//             const taskRepo = new chevre.repository.Task(mongoose.connection);
//             const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
//             const offerRepo = new chevre.repository.Offer(mongoose.connection);
//             const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
//             const eventAvailabilityRepo = new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient());
//             const offerRateLimitRepo = new chevre.repository.rateLimit.Offer(redis.getClient());
//             const productRepo = new chevre.repository.Product(mongoose.connection);
//             const reservationRepo = new chevre.repository.Reservation(mongoose.connection);

//             const transaction = await chevre.service.transaction.reserve.addReservations({
//                 id: req.params.transactionId,
//                 object: {
//                     event: req.body.object.event,
//                     acceptedOffer: req.body.object.acceptedOffer
//                 }
//             })({
//                 eventAvailability: eventAvailabilityRepo,
//                 event: eventRepo,
//                 offer: offerRepo,
//                 offerCatalog: offerCatalogRepo,
//                 offerRateLimit: offerRateLimitRepo,
//                 place: placeRepo,
//                 priceSpecification: priceSpecificationRepo,
//                 product: productRepo,
//                 reservation: reservationRepo,
//                 task: taskRepo,
//                 transaction: transactionRepo
//             });

//             // レスポンスデータ量が大きくて不要な場合、受け取らない選択ができるように
//             if (req.query.expectsNoContent === '1') {
//                 res.status(NO_CONTENT)
//                     .end();
//             } else {
//                 res.json(transaction);
//             }
//         } catch (error) {
//             next(error);
//         }
//     }
// );

/**
 * 取引確定
 */
reserveTransactionsRouter.put(
    '/:transactionId/confirm',
    permitScopes(['assetTransactions.write']),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);

            await chevre.service.transaction.reserve.confirm({
                ...req.body,
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            })({ transaction: transactionRepo });

            // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
            // tslint:disable-next-line:no-floating-promises
            chevre.service.transaction.exportTasks({
                status: chevre.factory.transactionStatusType.Confirmed,
                typeOf: { $in: [chevre.factory.assetTransactionType.Reserve] }
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

reserveTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes(['assetTransactions.write']),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            const actionRepo = new chevre.repository.Action(mongoose.connection);
            const eventAvailabilityRepo = new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient());
            const offerRateLimitRepo = new chevre.repository.rateLimit.Offer(redis.getClient());
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);

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
