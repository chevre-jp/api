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
 * 転送取引ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const http_status_1 = require("http-status");
const transferTransactionsRouter = express_1.Router();
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const pecorinoAuthClient = new chevre.pecorinoapi.auth.ClientCredentials({
    domain: chevre.credentials.pecorino.authorizeServerDomain,
    clientId: chevre.credentials.pecorino.clientId,
    clientSecret: chevre.credentials.pecorino.clientSecret,
    scopes: [],
    state: ''
});
transferTransactionsRouter.post('/start', permitScopes_1.default([]), ...[], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transferService = new chevre.pecorinoapi.service.transaction.Transfer({
            endpoint: chevre.credentials.pecorino.endpoint,
            auth: pecorinoAuthClient
        });
        const transaction = yield transferService.start(req.body);
        res.json(transaction);
    }
    catch (error) {
        next(chevre.errorHandler.handlePecorinoError(error));
    }
}));
transferTransactionsRouter.put('/:transactionId/confirm', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        const transferService = new chevre.pecorinoapi.service.transaction.Transfer({
            endpoint: chevre.credentials.pecorino.endpoint,
            auth: pecorinoAuthClient
        });
        yield transferService.confirm(Object.assign({}, (transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }));
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(chevre.errorHandler.handlePecorinoError(error));
    }
}));
transferTransactionsRouter.put('/:transactionId/cancel', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        const transferService = new chevre.pecorinoapi.service.transaction.Transfer({
            endpoint: chevre.credentials.pecorino.endpoint,
            auth: pecorinoAuthClient
        });
        yield transferService.cancel(Object.assign({}, (transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }));
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(chevre.errorHandler.handlePecorinoError(error));
    }
}));
exports.default = transferTransactionsRouter;
