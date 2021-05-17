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
 * 口座ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const http_status_1 = require("http-status");
const moment = require("moment");
const mongoose = require("mongoose");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const accountsRouter = express_1.Router();
/**
 * 口座同期
 */
// tslint:disable-next-line:use-default-type-parameter
accountsRouter.put('/sync', permitScopes_1.default([]), ...[], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountRepo = new chevre.repository.Account(mongoose.connection);
        const account = createAccount(Object.assign({}, req.body));
        yield accountRepo.accountModel.findByIdAndUpdate(account.id, account, { upsert: true })
            .exec();
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
function createAccount(params) {
    delete params._id;
    delete params.createdAt;
    delete params.updatedAt;
    return Object.assign(Object.assign(Object.assign({}, params), { balance: Number(params.balance), availableBalance: Number(params.availableBalance), openDate: moment(params.openDate)
            .toDate() }), (params.closeDate !== undefined && params.closeDate !== null)
        ? {
            closeDate: moment(params.closeDate)
                .toDate()
        }
        : undefined);
}
exports.default = accountsRouter;
