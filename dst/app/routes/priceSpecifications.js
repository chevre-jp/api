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
const http_status_1 = require("http-status");
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
priceSpecificationsRouter.post('', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        let priceSpecification = Object.assign({}, req.body);
        const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
        const doc = yield priceSpecificationRepo.priceSpecificationModel.create(priceSpecification);
        priceSpecification = doc.toObject();
        res.status(http_status_1.CREATED)
            .json(priceSpecification);
    }
    catch (error) {
        next(error);
    }
}));
priceSpecificationsRouter.get('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
        const doc = yield priceSpecificationRepo.priceSpecificationModel.findById(req.params.id)
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound('PriceSpecification');
        }
        const priceSpecification = doc.toObject();
        res.json(priceSpecification);
    }
    catch (error) {
        next(error);
    }
}));
priceSpecificationsRouter.put('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const priceSpecification = Object.assign({}, req.body);
        const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
        yield priceSpecificationRepo.priceSpecificationModel.findByIdAndUpdate(req.params.id, priceSpecification)
            .exec();
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
priceSpecificationsRouter.get('', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
        const searchCoinditions = Object.assign({}, req.query, { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const totalCount = yield priceSpecificationRepo.priceSpecificationModel.countDocuments({})
            .setOptions({ maxTimeMS: 10000 })
            .exec();
        const query = priceSpecificationRepo.priceSpecificationModel.find({}, {
            __v: 0,
            createdAt: 0,
            updatedAt: 0
        });
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (searchCoinditions.limit !== undefined && searchCoinditions.page !== undefined) {
            query.limit(searchCoinditions.limit)
                .skip(searchCoinditions.limit * (searchCoinditions.page - 1));
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (searchCoinditions.sort !== undefined) {
            query.sort(searchCoinditions.sort);
        }
        const priceSpecifications = yield query.setOptions({ maxTimeMS: 10000 })
            .exec()
            .then((docs) => docs.map((doc) => doc.toObject()));
        res.set('X-Total-Count', totalCount.toString())
            .json(priceSpecifications);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = priceSpecificationsRouter;
