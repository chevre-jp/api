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
 * 価格仕様ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const priceSpecificationsRouter = express_1.Router();
// priceSpecificationsRouter.get(
//     '/compoundPriceSpecification',
//     permitScopes([]),
//     validator,
//     async (req, res, next) => {
//         try {
//             const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
//             const searchConditions: any = {
//                 // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
//                 limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
//                 page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
//                 sort: req.query.sort,
//                 typeOf: chevre.factory.priceSpecificationType.CompoundPriceSpecification,
//                 priceComponent: req.query.priceComponent
//             };
//             const priceSpecifications = await priceSpecificationRepo.searchCompoundPriceSpecifications(searchConditions);
//             res.json(priceSpecifications);
//         } catch (error) {
//             next(error);
//         }
//     }
// );
priceSpecificationsRouter.post('', permitScopes_1.default(['priceSpecifications.*']), ...[
    express_validator_1.body('project')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = Object.assign(Object.assign({}, req.body.project), { typeOf: chevre.factory.organizationType.Project });
        let priceSpecification = Object.assign(Object.assign({}, req.body), { project: project });
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
priceSpecificationsRouter.get('/:id', permitScopes_1.default(['priceSpecifications.*']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
priceSpecificationsRouter.put('/:id', permitScopes_1.default(['priceSpecifications.*']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
priceSpecificationsRouter.delete('/:id', permitScopes_1.default(['priceSpecifications.*']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
        yield priceSpecificationRepo.priceSpecificationModel.findOneAndDelete({ _id: req.params.id })
            .exec();
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
priceSpecificationsRouter.get('', permitScopes_1.default(['priceSpecifications.*']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { project: { id: { $eq: req.project.id } }, 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const priceSpecifications = yield priceSpecificationRepo.search(searchConditions);
        res.json(priceSpecifications);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = priceSpecificationsRouter;
