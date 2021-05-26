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
 * プロダクトルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const productsRouter = express_1.Router();
/**
 * プロダクト作成
 */
productsRouter.post('', permitScopes_1.default(['products.*']), ...[
    express_validator_1.body('project')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productRepo = new chevre.repository.Product(mongoose.connection);
        const project = Object.assign(Object.assign({}, req.body.project), { typeOf: chevre.factory.organizationType.Project });
        const doc = yield productRepo.productModel.create(Object.assign(Object.assign({}, req.body), { project: project }));
        res.status(http_status_1.CREATED)
            .json(doc.toObject());
    }
    catch (error) {
        next(error);
    }
}));
/**
 * プロダクト検索
 */
productsRouter.get('', permitScopes_1.default(['products.*', 'products.read']), ...[
    express_validator_1.query('$projection.*')
        .toInt(),
    express_validator_1.query('offers.$elemMatch.validFrom.$gte')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('offers.$elemMatch.validFrom.$lte')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('offers.$elemMatch.validThrough.$gte')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('offers.$elemMatch.validThrough.$lte')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('offers.$elemMatch.availabilityEnds.$gte')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('offers.$elemMatch.availabilityEnds.$lte')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('offers.$elemMatch.availabilityStarts.$gte')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('offers.$elemMatch.availabilityStarts.$lte')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productRepo = new chevre.repository.Product(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const $projection = Object.assign(Object.assign({}, req.query.$projection), { 
            // defaultで隠蔽
            availableChannel: 0, 
            // 'availableChannel.credentials': 0,
            // 'availableChannel.serviceUrl': 0,
            'provider.credentials.shopPass': 0, 'provider.credentials.kgygishCd': 0, 'provider.credentials.stCd': 0 });
        const products = yield productRepo.search(searchConditions, $projection);
        res.json(products);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * プロダクト検索
 */
// tslint:disable-next-line:use-default-type-parameter
productsRouter.get('/:id', permitScopes_1.default(['products.*']), ...[
    express_validator_1.query('$projection.*')
        .toInt()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productRepo = new chevre.repository.Product(mongoose.connection);
        const product = yield productRepo.findById({ id: req.params.id }, (req.query.$projection !== undefined && req.query.$projection !== null) ? Object.assign({}, req.query.$projection) : undefined);
        res.json(product);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * プロダクトに対するオファー検索
 */
productsRouter.get('/:id/offers', permitScopes_1.default(['products.*', 'products.read']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerRepo = new chevre.repository.Offer(mongoose.connection);
        const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
        const productRepo = new chevre.repository.Product(mongoose.connection);
        const offers = yield chevre.service.offer.searchProductOffers({
            itemOffered: { id: req.params.id }
        })({
            offer: offerRepo,
            offerCatalog: offerCatalogRepo,
            product: productRepo
        });
        res.json(offers);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * プロダクト更新
 */
productsRouter.put('/:id', permitScopes_1.default(['products.*']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = { id: req.body.project.id, typeOf: chevre.factory.organizationType.Project };
        const product = Object.assign(Object.assign({}, req.body), { project: project });
        delete product.id;
        const productRepo = new chevre.repository.Product(mongoose.connection);
        yield productRepo.productModel.findOneAndUpdate({ _id: req.params.id }, product)
            .exec();
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
/**
 * プロダクト削除
 */
productsRouter.delete('/:id', permitScopes_1.default(['products.*']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productRepo = new chevre.repository.Product(mongoose.connection);
        yield productRepo.deleteById({ id: req.params.id });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = productsRouter;
