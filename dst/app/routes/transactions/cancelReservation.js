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
 * 予約キャンセル取引ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const http_status_1 = require("http-status");
const moment = require("moment");
const mongoose = require("mongoose");
const cancelReservationTransactionsRouter = express_1.Router();
const authentication_1 = require("../../middlewares/authentication");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
cancelReservationTransactionsRouter.use(authentication_1.default);
cancelReservationTransactionsRouter.post('/start', permitScopes_1.default(['admin', 'transactions']), (req, _, next) => {
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
        const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
        const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
        const project = Object.assign(Object.assign({}, req.body.project), { typeOf: 'Project' });
        const transaction = yield chevre.service.transaction.cancelReservation.start({
            project: project,
            typeOf: chevre.factory.transactionType.CancelReservation,
            agent: {
                typeOf: req.body.agent.typeOf,
                // id: (req.body.agent.id !== undefined) ? req.body.agent.id : req.user.sub,
                name: req.body.agent.name,
                url: req.body.agent.url
            },
            object: Object.assign({ clientUser: req.user }, req.body.object),
            expires: moment(req.body.expires)
                .toDate()
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
cancelReservationTransactionsRouter.put('/:transactionId/confirm', permitScopes_1.default(['admin', 'transactions']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
        yield chevre.service.transaction.cancelReservation.confirm(Object.assign(Object.assign({}, req.body), { id: req.params.transactionId }))({ transaction: transactionRepo });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
cancelReservationTransactionsRouter.put('/:transactionId/cancel', permitScopes_1.default(['admin', 'transactions']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
        yield transactionRepo.cancel({
            typeOf: chevre.factory.transactionType.CancelReservation,
            id: req.params.transactionId
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = cancelReservationTransactionsRouter;
