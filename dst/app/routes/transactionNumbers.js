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
 * 取引番号ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const redis = require("../../redis");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const transactionNumbersRouter = express_1.Router();
/**
 * 取引番号発行
 */
transactionNumbersRouter.post('', permitScopes_1.default(['transactionNumbers.write']), ...[
    express_validator_1.body('project.id')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
], validator_1.default, (__, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionNumberRepo = new chevre.repository.TransactionNumber(redis.getClient());
        const transactionNumber = yield transactionNumberRepo.publishByTimestamp({
            // project: { id: req.project.id },
            startDate: new Date()
        });
        res.status(http_status_1.CREATED)
            .json({ transactionNumber });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = transactionNumbersRouter;
