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
 * 配給ルーター
 * カテゴリーコードルーターのエイリアス
 * @deprecated Use categoryCode router
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const mongoose = require("mongoose");
const http_status_1 = require("http-status");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const distributorsRouter = express_1.Router();
distributorsRouter.use(authentication_1.default);
distributorsRouter.get('/list', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
        // const distributions = await distributionRepo.getDistributions();
        // res.json(distributions.map((d) => {
        //     return {
        //         ...d,
        //         codeValue: d.id,
        //         name: (typeof d.name === 'string')
        //             ? d.name
        //             : (d.name !== undefined && d.name !== null) ? (<any>d.name).ja : undefined
        //     };
        // }));
        const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);
        const searchConditions = Object.assign(Object.assign(Object.assign({}, req.query), (typeof req.query.name === 'string' && req.query.name.length > 0)
            ? { name: { $regex: req.query.name } }
            : undefined), { inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType } }, 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const categoryCodes = yield categoryCodeRepo.search(searchConditions);
        res.json(categoryCodes.map((c) => {
            return Object.assign(Object.assign({}, c), { name: c.name.ja });
        }));
    }
    catch (error) {
        next(error);
    }
}));
distributorsRouter.get('/search', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
        // const searchConditions: chevre.factory.distributor.ISearchConditions = {
        //     ...req.query,
        //     // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
        //     limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
        //     page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
        // };
        // const distributions = await distributionRepo.searchDistributions(searchConditions);
        // res.json(distributions.map((d) => {
        //     return {
        //         ...d,
        //         codeValue: d.id,
        //         name: (typeof d.name === 'string')
        //             ? d.name
        //             : (d.name !== undefined && d.name !== null) ? (<any>d.name).ja : undefined
        //     };
        // }));
        const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);
        const searchConditions = Object.assign(Object.assign(Object.assign({}, req.query), (typeof req.query.name === 'string' && req.query.name.length > 0)
            ? { name: { $regex: req.query.name } }
            : undefined), { inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType } }, 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const categoryCodes = yield categoryCodeRepo.search(searchConditions);
        res.json(categoryCodes.map((c) => {
            return Object.assign(Object.assign({}, c), { name: c.name.ja });
        }));
    }
    catch (error) {
        next(error);
    }
}));
distributorsRouter.put('/:id', permitScopes_1.default(['admin']), (req, _, next) => {
    req.checkBody('name')
        .exists()
        .withMessage('Required');
    next();
}, validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
        // await distributionRepo.updateDistribution(<any>{
        //     id: req.params.id,
        //     codeValue: req.params.id,
        //     name: (typeof req.body.name === 'string')
        //         ? { ja: req.body.name }
        //         : req.body.name
        // });
        const project = { id: req.body.project.id, typeOf: 'Project' };
        const categoryCode = {
            codeValue: req.params.id,
            typeOf: 'CategoryCode',
            inCodeSet: {
                typeOf: 'CategoryCodeSet',
                identifier: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType
            },
            name: (typeof req.body.name === 'string')
                ? { ja: req.body.name }
                : req.body.name,
            project: project
        };
        delete categoryCode.id;
        const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);
        yield categoryCodeRepo.categoryCodeModel.findByIdAndUpdate(req.params.id, categoryCode)
            .exec();
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
distributorsRouter.post('/add', permitScopes_1.default(['admin']), (req, _, next) => {
    req.checkBody('id')
        .exists()
        .withMessage('Required');
    req.checkBody('name')
        .exists()
        .withMessage('Required');
    next();
}, validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
        // const distributor = await distributionRepo.createDistribution(<any>{
        //     id: req.body.id,
        //     codeValue: req.params.id,
        //     name: (typeof req.body.name === 'string')
        //         ? { ja: req.body.name }
        //         : req.body.name
        // });
        // res.status(CREATED)
        //     .json({
        //         ...distributor,
        //         codeValue: distributor.id,
        //         name: (typeof distributor.name === 'string')
        //             ? distributor.name
        //             : (distributor.name !== undefined && distributor.name !== null) ? (<any>distributor.name).ja : undefined
        //     });
        const project = { id: req.body.project.id, typeOf: 'Project' };
        let categoryCode = {
            codeValue: req.body.id,
            typeOf: 'CategoryCode',
            inCodeSet: {
                typeOf: 'CategoryCodeSet',
                identifier: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType
            },
            name: (typeof req.body.name === 'string')
                ? { ja: req.body.name }
                : req.body.name,
            project: project
        };
        const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);
        const doc = yield categoryCodeRepo.categoryCodeModel.create(categoryCode);
        categoryCode = doc.toObject();
        res.status(http_status_1.CREATED)
            .json(Object.assign(Object.assign({}, categoryCode), { name: categoryCode.name.ja }));
    }
    catch (error) {
        next(error);
    }
}));
distributorsRouter.delete('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
        // await distributionRepo.deleteById({
        //     id: req.params.id
        // });
        const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);
        yield categoryCodeRepo.deleteById({
            id: req.params.id
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = distributorsRouter;
