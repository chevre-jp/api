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
 * 取引ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const mongoose = require("mongoose");
const cancelReservation_1 = require("./transactions/cancelReservation");
const moneyTransfer_1 = require("./transactions/moneyTransfer");
const pay_1 = require("./transactions/pay");
const refund_1 = require("./transactions/refund");
const registerService_1 = require("./transactions/registerService");
const reserve_1 = require("./transactions/reserve");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const transactionsRouter = express_1.Router();
transactionsRouter.use(authentication_1.default);
transactionsRouter.use('/cancelReservation', cancelReservation_1.default);
transactionsRouter.use(`/${chevre.factory.transactionType.MoneyTransfer}`, moneyTransfer_1.default);
transactionsRouter.use(`/${chevre.factory.transactionType.Pay}`, pay_1.default);
transactionsRouter.use(`/${chevre.factory.transactionType.Refund}`, refund_1.default);
transactionsRouter.use('/reserve', reserve_1.default);
transactionsRouter.use(`/${chevre.factory.transactionType.RegisterService}`, registerService_1.default);
/**
 * 取引検索
 */
transactionsRouter.get('', permitScopes_1.default(['admin']), ...[
    express_validator_1.query('limit')
        .optional()
        .isInt()
        .toInt(),
    express_validator_1.query('page')
        .optional()
        .isInt()
        .toInt(),
    express_validator_1.query('startFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('startThrough')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('endFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('endThrough')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1, sort: { startDate: chevre.factory.sortType.Descending } });
        const transactions = yield transactionRepo.search(searchConditions);
        res.json(transactions);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = transactionsRouter;
