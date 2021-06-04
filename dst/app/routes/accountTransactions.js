"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 口座取引ルーター
 */
const chevre = require("@chevre/domain");
const express = require("express");
const deposit_1 = require("./accountTransactions/deposit");
const transfer_1 = require("./accountTransactions/transfer");
const withdraw_1 = require("./accountTransactions/withdraw");
const accountTransactionsRouter = express.Router();
accountTransactionsRouter.use(`/${chevre.factory.account.transactionType.Deposit}`, deposit_1.default);
accountTransactionsRouter.use(`/${chevre.factory.account.transactionType.Withdraw}`, withdraw_1.default);
accountTransactionsRouter.use(`/${chevre.factory.account.transactionType.Transfer}`, transfer_1.default);
exports.default = accountTransactionsRouter;
