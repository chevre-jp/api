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
 * サービスアウトプットルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const mongoose = require("mongoose");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const serviceOutputsRouter = express_1.Router();
serviceOutputsRouter.use(authentication_1.default);
/**
 * 検索
 */
serviceOutputsRouter.get('', permitScopes_1.default(['admin', 'serviceOutputs', 'serviceOutputs.read-only']), ...[
    check_1.query('limit')
        .optional()
        .isInt()
        .toInt(),
    check_1.query('page')
        .optional()
        .isInt()
        .toInt()
    // query('bookingFrom')
    //     .optional()
    //     .isISO8601()
    //     .toDate(),
    // query('bookingThrough')
    //     .optional()
    //     .isISO8601()
    //     .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const serviceOutputRepo = new chevre.repository.ServiceOutput(mongoose.connection);
        // const searchConditions: chevre.factory.reservation.ISearchConditions<any> = {
        //     ...req.query,
        //     // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
        //     limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
        //     page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
        //     sort: { bookingTime: chevre.factory.sortType.Descending }
        // };
        const serviceOutputs = yield serviceOutputRepo.serviceOutputModel.find(Object.assign(Object.assign(Object.assign(Object.assign({}, (((_a = req.query.project) === null || _a === void 0 ? void 0 : _a.id) !== undefined) ? { 'project.id': (_b = req.query.project) === null || _b === void 0 ? void 0 : _b.id } : undefined), (req.query.typeOf !== undefined) ? { typeOf: req.query.typeOf } : undefined), (req.query.identifier !== undefined) ? { identifier: req.query.identifier } : undefined), (req.query.accessCode !== undefined) ? { accessCode: req.query.accessCode } : undefined))
            .limit(req.query.limit)
            .skip(req.query.limit * (req.query.page - 1))
            .select({ __v: 0, createdAt: 0, updatedAt: 0 })
            .exec()
            .then((docs) => docs.map((doc) => doc.toObject()));
        res.json(serviceOutputs);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = serviceOutputsRouter;
