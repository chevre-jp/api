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
const http_status_1 = require("http-status");
const moment = require("moment");
const mongoose = require("mongoose");
const reserveTransactionsRouter = express_1.Router();
const redis = require("../../../redis");
const authentication_1 = require("../../middlewares/authentication");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
reserveTransactionsRouter.use(authentication_1.default);
reserveTransactionsRouter.post('/start', permitScopes_1.default(['admin', 'transactions']), (req, _, next) => {
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
}, validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
        const transactionNumberRepo = new chevre.repository.TransactionNumber(redis.getClient());
        const project = Object.assign(Object.assign({}, req.body.project), { typeOf: 'Project' });
        const transaction = yield chevre.service.transaction.reserve.start({
            project: project,
            typeOf: chevre.factory.transactionType.Reserve,
            agent: Object.assign({}, req.body.agent
            // id: (req.body.agent.id !== undefined) ? req.body.agent.id : req.user.sub,
            ),
            object: Object.assign({}, req.body.object),
            expires: moment(req.body.expires)
                .toDate()
        })({
            project: projectRepo,
            transaction: transactionRepo,
            transactionNumber: transactionNumberRepo
        });
        res.json(transaction);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 予約追加
 */
reserveTransactionsRouter.post('/:transactionId/reservations', permitScopes_1.default(['admin', 'transactions']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const transaction = yield chevre.service.transaction.reserve.addReservations({
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
 * 取引確定
 */
reserveTransactionsRouter.put('/:transactionId/confirm', permitScopes_1.default(['admin', 'transactions']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
        yield chevre.service.transaction.reserve.confirm(Object.assign(Object.assign({}, req.body), (transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }))({ transaction: transactionRepo });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
reserveTransactionsRouter.put('/:transactionId/cancel', permitScopes_1.default(['admin', 'transactions']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        const actionRepo = new chevre.repository.Action(mongoose.connection);
        const eventAvailabilityRepo = new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient());
        const offerRateLimitRepo = new chevre.repository.rateLimit.Offer(redis.getClient());
        const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
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
