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
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
// import * as moment from 'moment';
const mongoose = require("mongoose");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const MAX_NUM_ACCOUNTS_CREATED = 100;
const pecorinoAuthClient = new chevre.pecorinoapi.auth.ClientCredentials({
    domain: chevre.credentials.pecorino.authorizeServerDomain,
    clientId: chevre.credentials.pecorino.clientId,
    clientSecret: chevre.credentials.pecorino.clientSecret,
    scopes: [],
    state: ''
});
const accountsRouter = express_1.Router();
/**
 * 口座同期
 */
// tslint:disable-next-line:use-default-type-parameter
// accountsRouter.put<ParamsDictionary>(
//     '/sync',
//     permitScopes([]),
//     ...[],
//     validator,
//     async (req, res, next) => {
//         try {
//             const accountRepo = new chevre.repository.Account(mongoose.connection);
//             const account = createAccount({
//                 ...req.body
//             });
//             await accountRepo.accountModel.findByIdAndUpdate(
//                 (<any>account).id,
//                 account,
//                 { upsert: true }
//             )
//                 .exec();
//             res.status(NO_CONTENT)
//                 .end();
//         } catch (error) {
//             next(error);
//         }
//     }
// );
// function createAccount(params: chevre.factory.account.IAccount): chevre.factory.account.IAccount {
//     delete (<any>params)._id;
//     delete (<any>params).createdAt;
//     delete (<any>params).updatedAt;
//     return {
//         ...params,
//         balance: Number(params.balance),
//         availableBalance: Number(params.availableBalance),
//         openDate: moment(params.openDate)
//             .toDate(),
//         ...(params.closeDate !== undefined && params.closeDate !== null)
//             ? {
//                 closeDate: moment(params.closeDate)
//                     .toDate()
//             }
//             : undefined
//     };
// }
/**
 * 口座解約
 * 冪等性の担保された処理となります。
 */
accountsRouter.put('/:accountNumber/close', permitScopes_1.default([]), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountService = new chevre.pecorinoapi.service.Account({
            endpoint: chevre.credentials.pecorino.endpoint,
            auth: pecorinoAuthClient
        });
        yield accountService.close({ accountNumber: req.params.accountNumber });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 口座開設
 */
accountsRouter.post('', permitScopes_1.default([]), ...[
    express_validator_1.body()
        .isArray({ max: MAX_NUM_ACCOUNTS_CREATED })
        .withMessage(() => `must be array <= ${MAX_NUM_ACCOUNTS_CREATED}`)
], 
// ...validations,
validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountService = new chevre.pecorinoapi.service.Account({
            endpoint: chevre.credentials.pecorino.endpoint,
            auth: pecorinoAuthClient
        });
        const accounts = yield accountService.open(req.body.map((b) => {
            return Object.assign(Object.assign({}, b), { project: { id: req.project.id, typeOf: chevre.factory.organizationType.Project } });
        }));
        res.status(http_status_1.CREATED)
            .json(accounts);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 口座検索
 */
accountsRouter.get('', permitScopes_1.default([]), ...[
    express_validator_1.query('openDate.$gte')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('openDate.$lte')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountRepo = new chevre.repository.Account(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { project: { id: { $eq: req.project.id } }, 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const accounts = yield accountRepo.search(searchConditions);
        res.json(accounts);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 口座アクション検索(口座番号指定)
 */
// tslint:disable-next-line:use-default-type-parameter
accountsRouter.get('/:accountNumber/actions/moneyTransfer', permitScopes_1.default([]), ...[
    express_validator_1.query('startDate.$gte')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('startDate.$lte')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const actionRepo = new chevre.repository.AccountAction(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { project: { id: { $eq: req.project.id } }, 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1, accountNumber: req.params.accountNumber });
        let actions = yield actionRepo.searchTransferActions(searchConditions);
        // 互換性維持対応
        actions = actions.map((a) => {
            return Object.assign(Object.assign({}, a), { amount: (typeof a.amount === 'number')
                    ? {
                        typeOf: 'MonetaryAmount',
                        currency: 'Point',
                        value: a.amount
                    }
                    : a.amount });
        });
        res.json(actions);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = accountsRouter;
