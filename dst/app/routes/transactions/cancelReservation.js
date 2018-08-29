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
 * 予約キャンセル取引ルーター
 */
const chevre = require("@chevre/domain");
const createDebug = require("debug");
const express_1 = require("express");
const http_status_1 = require("http-status");
const moment = require("moment");
const cancelReservationTransactionsRouter = express_1.Router();
const authentication_1 = require("../../middlewares/authentication");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const debug = createDebug('chevre-api:routes');
cancelReservationTransactionsRouter.use(authentication_1.default);
cancelReservationTransactionsRouter.post('/start', permitScopes_1.default(['admin', 'transactions']), (req, _, next) => {
    req.checkBody('expires', 'invalid expires').notEmpty().withMessage('expires is required').isISO8601();
    req.checkBody('agent', 'invalid agent').notEmpty().withMessage('agent is required');
    req.checkBody('agent.typeOf', 'invalid agent.typeOf').notEmpty().withMessage('agent.typeOf is required');
    req.checkBody('agent.name', 'invalid agent.name').notEmpty().withMessage('agent.name is required');
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const transactionRepo = new chevre.repository.Transaction(chevre.mongoose.connection);
        const reservationRepo = new chevre.repository.Reservation(chevre.mongoose.connection);
        const transaction = yield chevre.service.transaction.cancelReservation.start({
            typeOf: chevre.factory.transactionType.CancelReservation,
            agent: {
                typeOf: req.body.agent.typeOf,
                // id: (req.body.agent.id !== undefined) ? req.body.agent.id : req.user.sub,
                name: req.body.agent.name,
                url: req.body.agent.url
            },
            object: {
                clientUser: req.user,
                transaction: req.body.object.transaction
            },
            expires: moment(req.body.expires).toDate()
        })({
            reservation: reservationRepo,
            transaction: transactionRepo
        });
        res.json(transaction);
    }
    catch (error) {
        next(error);
    }
}));
cancelReservationTransactionsRouter.put('/:transactionId/confirm', permitScopes_1.default(['admin', 'transactions']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const transactionRepo = new chevre.repository.Transaction(chevre.mongoose.connection);
        yield chevre.service.transaction.cancelReservation.confirm({
            transactionId: req.params.transactionId
        })({ transaction: transactionRepo });
        debug('transaction confirmed.');
        res.status(http_status_1.NO_CONTENT).end();
    }
    catch (error) {
        next(error);
    }
}));
cancelReservationTransactionsRouter.put('/:transactionId/cancel', permitScopes_1.default(['admin', 'transactions']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
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
exports.default = cancelReservationTransactionsRouter;
