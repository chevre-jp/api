"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 予約取引ルーター
 */
const chevre = require("@chevre/domain");
const createDebug = require("debug");
const express_1 = require("express");
const http_status_1 = require("http-status");
const moment = require("moment");
const reserveTransactionsRouter = express_1.Router();
const redis = require("../../../redis");
const authentication_1 = require("../../middlewares/authentication");
// import permitScopes from '../../middlewares/permitScopes';
const validator_1 = require("../../middlewares/validator");
const debug = createDebug('chevre-api:routes');
reserveTransactionsRouter.use(authentication_1.default);
reserveTransactionsRouter.post('/start', 
// permitScopes(['admin']),
(req, _, next) => {
    req.checkBody('expires', 'invalid expires').notEmpty().withMessage('expires is required').isISO8601();
    req.checkBody('agent', 'invalid agent').notEmpty().withMessage('agent is required');
    req.checkBody('agent.typeOf', 'invalid agent.typeOf').notEmpty().withMessage('agent.typeOf is required');
    req.checkBody('agent.name', 'invalid agent.name').notEmpty().withMessage('agent.name is required');
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        const transactionRepo = new chevre.repository.Transaction(chevre.mongoose.connection);
        const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
        const eventAvailabilityRepo = new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient());
        const reservationRepo = new chevre.repository.Reservation(chevre.mongoose.connection);
        const reservationNumberRepo = new chevre.repository.ReservationNumber(redis.getClient());
        const transaction = yield chevre.service.transaction.reserve.start({
            typeOf: chevre.factory.transactionType.Reserve,
            agent: {
                typeOf: req.body.agent.typeOf,
                // id: (req.body.agent.id !== undefined) ? req.body.agent.id : req.user.sub,
                name: req.body.agent.name,
                url: req.body.agent.url
            },
            object: {
                // clientUser: req.user,
                event: req.body.object.event,
                tickets: req.body.object.tickets,
                notes: (req.body.object.notes !== undefined) ? req.body.object.notes : ''
            },
            expires: moment(req.body.expires).toDate()
        })({
            eventAvailability: eventAvailabilityRepo,
            event: eventRepo,
            reservation: reservationRepo,
            reservationNumber: reservationNumberRepo,
            transaction: transactionRepo,
            ticketType: ticketTypeRepo
        });
        res.json(transaction);
    }
    catch (error) {
        next(error);
    }
}));
reserveTransactionsRouter.put('/:transactionId/confirm', 
// permitScopes(['admin']),
validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const transactionRepo = new chevre.repository.Transaction(chevre.mongoose.connection);
        yield chevre.service.transaction.reserve.confirm({
            transactionId: req.params.transactionId
        })({ transaction: transactionRepo });
        debug('transaction confirmed.');
        res.status(http_status_1.NO_CONTENT).end();
    }
    catch (error) {
        next(error);
    }
}));
reserveTransactionsRouter.put('/:transactionId/cancel', 
// permitScopes(['admin']),
validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const transactionRepo = new chevre.repository.Transaction(chevre.mongoose.connection);
        yield transactionRepo.cancel(chevre.factory.transactionType.Reserve, req.params.transactionId);
        debug('transaction canceled.');
        res.status(http_status_1.NO_CONTENT).end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = reserveTransactionsRouter;
