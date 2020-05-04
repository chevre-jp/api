"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 取引ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const cancelReservation_1 = require("./transactions/cancelReservation");
const registerProgramMembership_1 = require("./transactions/registerProgramMembership");
const registerService_1 = require("./transactions/registerService");
const reserve_1 = require("./transactions/reserve");
const transactionsRouter = express_1.Router();
transactionsRouter.use('/cancelReservation', cancelReservation_1.default);
transactionsRouter.use('/reserve', reserve_1.default);
transactionsRouter.use(`/${chevre.factory.transactionType.RegisterProgramMembership}`, registerProgramMembership_1.default);
transactionsRouter.use(`/${chevre.factory.transactionType.RegisterService}`, registerService_1.default);
exports.default = transactionsRouter;
