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
 * 出金取引ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const http_status_1 = require("http-status");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const pecorinoAuthClient = new chevre.pecorinoapi.auth.ClientCredentials({
    domain: chevre.credentials.pecorino.authorizeServerDomain,
    clientId: chevre.credentials.pecorino.clientId,
    clientSecret: chevre.credentials.pecorino.clientSecret,
    scopes: [],
    state: ''
});
const withdrawTransactionsRouter = express_1.Router();
withdrawTransactionsRouter.post('/start', permitScopes_1.default([]), ...[], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const withdrawService = new chevre.pecorinoapi.service.transaction.Withdraw({
            endpoint: chevre.credentials.pecorino.endpoint,
            auth: pecorinoAuthClient
        });
        const transaction = yield withdrawService.start(req.body);
        res.json(transaction);
    }
    catch (error) {
        next(chevre.errorHandler.handlePecorinoError(error));
    }
}));
withdrawTransactionsRouter.put('/:transactionId/confirm', permitScopes_1.default([]), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        const withdrawService = new chevre.pecorinoapi.service.transaction.Withdraw({
            endpoint: chevre.credentials.pecorino.endpoint,
            auth: pecorinoAuthClient
        });
        yield withdrawService.confirm(Object.assign({}, (transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }));
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(chevre.errorHandler.handlePecorinoError(error));
    }
}));
withdrawTransactionsRouter.put('/:transactionId/cancel', permitScopes_1.default([]), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        const withdrawService = new chevre.pecorinoapi.service.transaction.Withdraw({
            endpoint: chevre.credentials.pecorino.endpoint,
            auth: pecorinoAuthClient
        });
        yield withdrawService.cancel(Object.assign({}, (transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }));
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(chevre.errorHandler.handlePecorinoError(error));
    }
}));
exports.default = withdrawTransactionsRouter;
