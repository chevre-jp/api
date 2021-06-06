"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 予約取引ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const moment = require("moment");
const mongoose = require("mongoose");
const reserveTransactionsRouter = express_1.Router();
const redis = require("../../../redis");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
reserveTransactionsRouter.post('/start', permitScopes_1.default(['assetTransactions.write']), ...[
    express_validator_1.body('project')
        .not()
        .isEmpty()
        .withMessage('Required'),
    express_validator_1.body('expires', 'invalid expires')
        .not()
        .isEmpty()
        .withMessage('Required')
        .isISO8601(),
    express_validator_1.body('agent', 'invalid agent')
        .not()
        .isEmpty()
        .withMessage('Required'),
    express_validator_1.body('agent.typeOf', 'invalid agent.typeOf')
        .not()
        .isEmpty()
        .withMessage('Required'),
    express_validator_1.body('agent.name', 'invalid agent.name')
        .not()
        .isEmpty()
        .withMessage('Required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const project = { id: req.project.id, typeOf: chevre.factory.organizationType.Project };
        const transaction = yield chevre.service.transaction.reserve.start(Object.assign({ project: project, typeOf: chevre.factory.assetTransactionType.Reserve, agent: req.body.agent, object: req.body.object, expires: moment(req.body.expires)
                .toDate() }, (typeof req.body.transactionNumber === 'string') ? { transactionNumber: req.body.transactionNumber } : undefined))({
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
            res.status(http_status_1.NO_CONTENT)
                .end();
        }
        else {
            res.json(transaction);
        }
    }
    catch (error) {
        next(error);
    }
}));
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
reserveTransactionsRouter.put('/:transactionId/confirm', permitScopes_1.default(['assetTransactions.write']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
        yield chevre.service.transaction.reserve.confirm(Object.assign(Object.assign({}, req.body), (transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }))({ transaction: transactionRepo });
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
            .then((tasks) => __awaiter(void 0, void 0, void 0, function* () {
            // タスクがあればすべて実行
            if (Array.isArray(tasks)) {
                yield Promise.all(tasks.map((task) => __awaiter(void 0, void 0, void 0, function* () {
                    yield chevre.service.task.executeByName({ name: task.name })({
                        connection: mongoose.connection,
                        redisClient: redis.getClient()
                    });
                })));
            }
        }));
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
reserveTransactionsRouter.put('/:transactionId/cancel', permitScopes_1.default(['assetTransactions.write']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        const actionRepo = new chevre.repository.Action(mongoose.connection);
        const eventAvailabilityRepo = new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient());
        const offerRateLimitRepo = new chevre.repository.rateLimit.Offer(redis.getClient());
        const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
        yield chevre.service.transaction.reserve.cancel(Object.assign(Object.assign({}, req.body), (transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }))({
            action: actionRepo,
            eventAvailability: eventAvailabilityRepo,
            offerRateLimit: offerRateLimitRepo,
            reservation: reservationRepo,
            task: taskRepo,
            transaction: transactionRepo
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = reserveTransactionsRouter;
