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
 * メンバーシッププログラムルーター
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
const programMembershipsRouter = express_1.Router();
programMembershipsRouter.use(authentication_1.default);
/**
 * メンバーシッププログラム作成
 */
programMembershipsRouter.post('', permitScopes_1.default(['admin']), ...[
    check_1.body('project')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const programMembershipRepo = new chevre.repository.ProgramMembership(mongoose.connection);
        const project = Object.assign(Object.assign({}, req.body.project), { typeOf: 'Project' });
        const doc = yield programMembershipRepo.programMembershipModel.create(Object.assign(Object.assign({}, req.body), { project: project }));
        res.status(http_status_1.CREATED)
            .json(doc.toObject());
    }
    catch (error) {
        next(error);
    }
}));
/**
 * メンバーシッププログラム検索
 */
programMembershipsRouter.get('', permitScopes_1.default(['admin']), ...[], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const programMembershipRepo = new chevre.repository.ProgramMembership(mongoose.connection);
        // const searchCoinditions = {
        //     ...req.query,
        //     // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
        //     limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
        //     page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
        // };
        // const totalCount = await programMembershipRepo.count(searchCoinditions);
        // const programMemberships = await programMembershipRepo.search(searchCoinditions);
        const searchConditions = Object.assign({}, (req.query.project !== undefined && req.query.project !== null
            && req.query.project.id !== undefined && req.query.project.id !== null
            && typeof req.query.project.id.$eq === 'string')
            ? {
                'project.id': {
                    $exists: true,
                    $eq: req.query.project.id.$eq
                }
            }
            : {});
        const totalCount = yield programMembershipRepo.programMembershipModel.countDocuments(searchConditions)
            .exec();
        const programMemberships = yield programMembershipRepo.programMembershipModel.find(searchConditions)
            .exec()
            .then((docs) => docs.map((doc) => doc.toObject()));
        res.set('X-Total-Count', totalCount.toString())
            .json(programMemberships);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * メンバーシッププログラム検索
 */
programMembershipsRouter.get('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const programMembershipRepo = new chevre.repository.ProgramMembership(mongoose.connection);
        const doc = yield programMembershipRepo.programMembershipModel.findById({ _id: req.params.id })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound('ProgramMembership');
        }
        res.json(doc.toObject());
    }
    catch (error) {
        next(error);
    }
}));
/**
 * メンバーシッププログラムに対するオファー検索
 */
programMembershipsRouter.get('/:id/offers', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerRepo = new chevre.repository.Offer(mongoose.connection);
        const programMembershipRepo = new chevre.repository.ProgramMembership(mongoose.connection);
        // メンバーシッププログラム検索
        const programMembershipDoc = yield programMembershipRepo.programMembershipModel.findById({ _id: req.params.id })
            .exec();
        if (programMembershipDoc === null) {
            throw new chevre.factory.errors.NotFound('ProgramMembership');
        }
        const programMembership = programMembershipDoc.toObject();
        // オファーカタログ検索
        const offerCatalog = yield offerRepo.findOfferCatalogById({ id: programMembership.hasOfferCatalog.id });
        // オファー検索
        const offers = yield offerRepo.offerModel.find({ _id: { $in: offerCatalog.itemListElement.map((e) => e.id) } }, {
            __v: 0,
            createdAt: 0,
            updatedAt: 0
        })
            .exec()
            .then((docs) => docs.map((doc) => doc.toObject()));
        const programMembershipOffers = offers
            .map((o) => {
            const unitSpec = o.priceSpecification;
            const compoundPriceSpecification = {
                project: programMembership.project,
                typeOf: chevre.factory.priceSpecificationType.CompoundPriceSpecification,
                priceCurrency: chevre.factory.priceCurrency.JPY,
                valueAddedTaxIncluded: true,
                priceComponent: [
                    unitSpec
                ]
            };
            return Object.assign(Object.assign({}, o), { priceSpecification: compoundPriceSpecification });
        });
        res.json(programMembershipOffers);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * メンバーシッププログラム更新
 */
// programMembershipsRouter.put(
//     '/:id',
//     permitScopes(['admin']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const programMembershipRepo = new chevre.repository.ProgramMembership(mongoose.connection);
//             await programMembershipRepo.save(req.body);
//             res.status(NO_CONTENT)
//                 .end();
//         } catch (error) {
//             next(error);
//         }
//     }
// );
/**
 * メンバーシッププログラム削除
 */
// programMembershipsRouter.delete(
//     '/:id',
//     permitScopes(['admin']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const programMembershipRepo = new chevre.repository.ProgramMembership(mongoose.connection);
//             await programMembershipRepo.deleteById({ id: req.params.id });
//             res.status(NO_CONTENT)
//                 .end();
//         } catch (error) {
//             next(error);
//         }
//     }
// );
exports.default = programMembershipsRouter;
