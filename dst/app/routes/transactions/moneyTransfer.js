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
 * 通貨転送取引ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const moment = require("moment");
const mongoose = require("mongoose");
const moneyTransferTransactionsRouter = express_1.Router();
const redis = require("../../../redis");
const authentication_1 = require("../../middlewares/authentication");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
moneyTransferTransactionsRouter.use(authentication_1.default);
moneyTransferTransactionsRouter.post('/start', permitScopes_1.default(['admin']), ...[
    check_1.body('project')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('expires')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
        .isISO8601()
        .toDate(),
    check_1.body('agent.typeOf')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('agent.name')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('recipient.typeOf')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('recipient.name')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const moneyTransferTransactionNumberRepo = new chevre.repository.MoneyTransferTransactionNumber(redis.getClient());
        const serviceOutputRepo = new chevre.repository.ServiceOutput(mongoose.connection);
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
        const project = Object.assign(Object.assign({}, req.body.project), { typeOf: 'Project' });
        const transaction = yield chevre.service.transaction.moneyTransfer.start(Object.assign({ typeOf: chevre.factory.transactionType.MoneyTransfer, project: project, agent: req.body.agent, object: req.body.object, recipient: req.body.recipient, expires: moment(req.body.expires)
                .toDate() }, (typeof req.body.transactionNumber === 'string') ? { transactionNumber: req.body.transactionNumber } : undefined))({
            moneyTransferTransactionNumber: moneyTransferTransactionNumberRepo,
            project: projectRepo,
            serviceOutput: serviceOutputRepo,
            transaction: transactionRepo
        });
        res.json(transaction);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 取引確定
 */
moneyTransferTransactionsRouter.put('/:transactionId/confirm', permitScopes_1.default(['admin', 'transactions']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
        yield chevre.service.transaction.moneyTransfer.confirm(Object.assign(Object.assign({}, req.body), (transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }))({ transaction: transactionRepo });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
moneyTransferTransactionsRouter.put('/:transactionId/cancel', permitScopes_1.default(['admin', 'transactions']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
        yield chevre.service.transaction.moneyTransfer.cancel(Object.assign(Object.assign({}, req.body), (transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }))({
            transaction: transactionRepo
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = moneyTransferTransactionsRouter;
