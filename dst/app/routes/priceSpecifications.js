"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 価格仕様ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const mongoose = require("mongoose");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const priceSpecificationsRouter = express_1.Router();
priceSpecificationsRouter.use(authentication_1.default);
priceSpecificationsRouter.get('/compoundPriceSpecification', permitScopes_1.default(['admin']), (_, __, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
        const searchCoinditions = {
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
            page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
            sort: req.query.sort,
            typeOf: chevre.factory.priceSpecificationType.CompoundPriceSpecification,
            priceComponent: req.query.priceComponent
        };
        const totalCount = yield priceSpecificationRepo.countCompoundPriceSpecifications(searchCoinditions);
        const priceSpecifications = yield priceSpecificationRepo.searchCompoundPriceSpecifications(searchCoinditions);
        res.set('X-Total-Count', totalCount.toString());
        res.json(priceSpecifications);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = priceSpecificationsRouter;
