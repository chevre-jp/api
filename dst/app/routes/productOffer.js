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
 * プロダクトオファールーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const productOffersRouter = express_1.Router();
productOffersRouter.use(authentication_1.default);
productOffersRouter.post('', permitScopes_1.default(['admin']), ...[
    check_1.body('project')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const offerRepo = new chevre.repository.Offer(mongoose.connection);
        const project = Object.assign({}, req.body.project, { typeOf: 'Project' });
        const ticketType = yield offerRepo.saveProductOffer(Object.assign({}, req.body, { id: '', project: project }));
        res.status(http_status_1.CREATED)
            .json(ticketType);
    }
    catch (error) {
        next(error);
    }
}));
productOffersRouter.get('', permitScopes_1.default(['admin']), ...[
    check_1.query('priceSpecification.minPrice')
        .optional()
        .isInt()
        .toInt(),
    check_1.query('priceSpecification.maxPrice')
        .optional()
        .isInt()
        .toInt(),
    check_1.query('priceSpecification.accounting.minAccountsReceivable')
        .optional()
        .isInt()
        .toInt(),
    check_1.query('priceSpecification.accounting.maxAccountsReceivable')
        .optional()
        .isInt()
        .toInt(),
    check_1.query('priceSpecification.referenceQuantity.value')
        .optional()
        .isInt()
        .toInt()
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const offerRepo = new chevre.repository.Offer(mongoose.connection);
        const searchCoinditions = Object.assign({}, req.query, { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const totalCount = yield offerRepo.countProductOffers(searchCoinditions);
        const offers = yield offerRepo.searchProductOffers(searchCoinditions);
        res.set('X-Total-Count', totalCount.toString())
            .json(offers);
    }
    catch (error) {
        next(error);
    }
}));
productOffersRouter.put('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const offerRepo = new chevre.repository.Offer(mongoose.connection);
        yield offerRepo.saveProductOffer(req.body);
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
productOffersRouter.delete('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const offerRepo = new chevre.repository.Offer(mongoose.connection);
        yield offerRepo.deleteProductOffer({ id: req.params.id });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = productOffersRouter;
