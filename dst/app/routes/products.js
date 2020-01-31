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
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const productsRouter = express_1.Router();
productsRouter.use(authentication_1.default);
/**
 * プロダクト作成
 */
productsRouter.post('', permitScopes_1.default(['admin']), ...[
    check_1.body('project')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productRepo = new chevre.repository.Product(mongoose.connection);
        const project = Object.assign(Object.assign({}, req.body.project), { typeOf: 'Project' });
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
productsRouter.get('', permitScopes_1.default(['admin']), ...[], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productRepo = new chevre.repository.Product(mongoose.connection);
        // const searchConditions = {
        //     ...req.query,
        //     // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
        //     limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
        //     page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
        // };
        // const totalCount = await productRepo.count(searchConditions);
        // const products = await productRepo.search(searchConditions);
        const searchConditions = Object.assign(Object.assign({}, (req.query.project !== undefined && req.query.project !== null
            && req.query.project.id !== undefined && req.query.project.id !== null
            && typeof req.query.project.id.$eq === 'string')
            ? {
                'project.id': {
                    $exists: true,
                    $eq: req.query.project.id.$eq
                }
            }
            : {}), (req.query.typeOf !== undefined && req.query.typeOf !== null
            && typeof req.query.typeOf.$eq === 'string')
            ? {
                typeOf: {
                    $eq: req.query.typeOf.$eq
                }
            }
            : {});
        const products = yield productRepo.productModel.find(searchConditions)
            .exec()
            .then((docs) => docs.map((doc) => doc.toObject()));
        res.json(products);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * プロダクト検索
 */
productsRouter.get('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productRepo = new chevre.repository.Product(mongoose.connection);
        const doc = yield productRepo.productModel.findById({ _id: req.params.id })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound(productRepo.productModel.modelName);
        }
        res.json(doc.toObject());
    }
    catch (error) {
        next(error);
    }
}));
/**
 * プロダクトに対するオファー検索
 */
productsRouter.get('/:id/offers', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerRepo = new chevre.repository.Offer(mongoose.connection);
        const productRepo = new chevre.repository.Product(mongoose.connection);
        // プロダクト検索
        const product = yield productRepo.productModel.findById({ _id: req.params.id })
            .exec()
            .then((doc) => {
            if (doc === null) {
                throw new chevre.factory.errors.NotFound(productRepo.productModel.modelName);
            }
            return doc.toObject();
        });
        // オファーカタログ検索
        const offerCatalog = yield offerRepo.findOfferCatalogById({ id: product.hasOfferCatalog.id });
        // オファー検索
        const offers = yield offerRepo.offerModel.find({ _id: { $in: offerCatalog.itemListElement.map((e) => e.id) } }, {
            __v: 0,
            createdAt: 0,
            updatedAt: 0
        })
            .exec()
            .then((docs) => docs.map((doc) => doc.toObject()));
        const productOffers = offers
            .map((o) => {
            const unitSpec = o.priceSpecification;
            const compoundPriceSpecification = {
                project: product.project,
                typeOf: chevre.factory.priceSpecificationType.CompoundPriceSpecification,
                priceCurrency: chevre.factory.priceCurrency.JPY,
                valueAddedTaxIncluded: true,
                priceComponent: [
                    unitSpec
                ]
            };
            return Object.assign(Object.assign({}, o), { priceSpecification: compoundPriceSpecification });
        });
        res.json(productOffers);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * プロダクト更新
 */
// productsRouter.put(
//     '/:id',
//     permitScopes(['admin']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const productRepo = new chevre.repository.Product(mongoose.connection);
//             await productRepo.save(req.body);
//             res.status(NO_CONTENT)
//                 .end();
//         } catch (error) {
//             next(error);
//         }
//     }
// );
/**
 * プロダクト削除
 */
// productsRouter.delete(
//     '/:id',
//     permitScopes(['admin']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const productRepo = new chevre.repository.Product(mongoose.connection);
//             await productRepo.deleteById({ id: req.params.id });
//             res.status(NO_CONTENT)
//                 .end();
//         } catch (error) {
//             next(error);
//         }
//     }
// );
exports.default = productsRouter;