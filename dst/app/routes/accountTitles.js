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
 * 勘定科目ルーター
 */
const chevre = require("@chevre/domain");
const createDebug = require("debug");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const debug = createDebug('chevre-api:router');
const accountTitlesRouter = express_1.Router();
/**
 * 科目分類追加
 */
accountTitlesRouter.post('/accountTitleCategory', permitScopes_1.default(['accountTitles.*']), ...[
    express_validator_1.body('project')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('codeValue')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('name')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = { id: req.project.id, typeOf: chevre.factory.organizationType.Project };
        const accountTitle = Object.assign(Object.assign({}, req.body), { project: project });
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        yield accountTitleRepo.accountTitleModel.create(accountTitle);
        res.status(http_status_1.CREATED)
            .json(accountTitle);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 科目分類検索
 */
accountTitlesRouter.get('/accountTitleCategory', permitScopes_1.default(['accountTitles.*', 'accountTitles', 'accountTitles.read-only']), validator_1.default, 
// tslint:disable-next-line:max-func-body-length
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { project: { id: { $eq: req.project.id } }, 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        // const accountTitles = await accountTitleRepo.search(searchConditions);
        // res.json(accountTitles);
        const conditions = [
            { typeOf: 'AccountTitle' }
        ];
        if (typeof ((_b = (_a = searchConditions.project) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.$eq) === 'string') {
            conditions.push({
                'project.id': {
                    // $exists: true,
                    $eq: searchConditions.project.id.$eq
                }
            });
        }
        if (typeof searchConditions.codeValue === 'string') {
            conditions.push({
                codeValue: {
                    $exists: true,
                    $regex: new RegExp(searchConditions.codeValue)
                }
            });
        }
        else if (searchConditions.codeValue !== undefined && searchConditions.codeValue !== null) {
            if (typeof searchConditions.codeValue.$eq === 'string') {
                conditions.push({
                    codeValue: {
                        $exists: true,
                        $eq: searchConditions.codeValue.$eq
                    }
                });
            }
        }
        const nameRegex = searchConditions.name;
        if (typeof nameRegex === 'string') {
            conditions.push({
                name: {
                    $exists: true,
                    $regex: new RegExp(nameRegex)
                }
            });
        }
        // const totalCount = await accountTitleRepo.accountTitleModel.countDocuments(
        //     { $and: conditions }
        // )
        //     .setOptions({ maxTimeMS: 10000 })
        //     .exec();
        const query = accountTitleRepo.accountTitleModel.find({ $and: conditions }, {
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
            hasCategoryCode: 0
        });
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (searchConditions.limit !== undefined && searchConditions.page !== undefined) {
            query.limit(searchConditions.limit)
                .skip(searchConditions.limit * (searchConditions.page - 1));
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (searchConditions.sort !== undefined) {
            query.sort(searchConditions.sort);
        }
        const accountTitles = yield query.setOptions({ maxTimeMS: 10000 })
            .exec()
            .then((docs) => docs.map((doc) => doc.toObject()));
        res.json(accountTitles);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 科目分類更新
 */
// tslint:disable-next-line:use-default-type-parameter
accountTitlesRouter.put('/accountTitleCategory/:codeValue', permitScopes_1.default(['accountTitles.*']), ...[
    express_validator_1.body('codeValue')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('name')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountTitleCategory = Object.assign(Object.assign({}, req.body), { codeValue: req.params.codeValue });
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        const doc = yield accountTitleRepo.accountTitleModel.findOneAndUpdate({
            'project.id': {
                // $exists: true,
                $eq: accountTitleCategory.project.id
            },
            codeValue: accountTitleCategory.codeValue
        }, accountTitleCategory, { new: true })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound(accountTitleRepo.accountTitleModel.modelName);
        }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 科目分類削除
 */
// tslint:disable-next-line:use-default-type-parameter
accountTitlesRouter.delete('/accountTitleCategory/:codeValue', permitScopes_1.default(['accountTitles.*']), ...[
    express_validator_1.body('project.id')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountTitleCategory = Object.assign(Object.assign({}, req.body), { codeValue: req.params.codeValue });
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        yield accountTitleRepo.accountTitleModel.findOneAndDelete({
            'project.id': {
                // $exists: true,
                $eq: accountTitleCategory.project.id
            },
            codeValue: accountTitleCategory.codeValue
        })
            .exec()
            .then((doc) => {
            if (doc === null) {
                throw new chevre.factory.errors.NotFound(accountTitleRepo.accountTitleModel.modelName);
            }
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 科目追加
 */
accountTitlesRouter.post('/accountTitleSet', permitScopes_1.default(['accountTitles.*']), ...[
    express_validator_1.body('codeValue')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('name')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('inCodeSet')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('inCodeSet.codeValue')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountTitleCategory = Object.assign(Object.assign({}, req.body.inCodeSet), { project: { id: req.project.id, typeOf: chevre.factory.organizationType.Project } });
        const accountTitleSet = Object.assign(Object.assign({}, req.body), { project: { id: req.project.id, typeOf: chevre.factory.organizationType.Project } });
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        // 科目分類の存在確認
        let doc = yield accountTitleRepo.accountTitleModel.findOne({
            'project.id': {
                // $exists: true,
                $eq: req.project.id
            },
            codeValue: accountTitleCategory.codeValue
        })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound('AccountTitleCategory');
        }
        const newAccountTitleSet = {
            project: { id: req.project.id, typeOf: chevre.factory.organizationType.Project },
            typeOf: accountTitleSet.typeOf,
            codeValue: accountTitleSet.codeValue,
            name: accountTitleSet.name,
            additionalProperty: (Array.isArray(accountTitleSet.additionalProperty)) ? accountTitleSet.additionalProperty : [],
            hasCategoryCode: []
        };
        debug('creating accountTitleSet', accountTitleSet);
        doc = yield accountTitleRepo.accountTitleModel.findOneAndUpdate({
            'project.id': {
                // $exists: true,
                $eq: req.project.id
            },
            codeValue: accountTitleCategory.codeValue,
            'hasCategoryCode.codeValue': { $ne: accountTitleSet.codeValue }
        }, {
            $push: {
                hasCategoryCode: newAccountTitleSet
            }
        }, { new: true })
            .exec();
        // 存在しなければ科目コード重複
        if (doc === null) {
            throw new chevre.factory.errors.AlreadyInUse('AccountTitle', ['hasCategoryCode.codeValue']);
        }
        res.status(http_status_1.CREATED)
            .json(accountTitleSet);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 科目検索
 */
accountTitlesRouter.get('/accountTitleSet', permitScopes_1.default(['accountTitles.*', 'accountTitles', 'accountTitles.read-only']), validator_1.default, 
// tslint:disable-next-line:max-func-body-length
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    try {
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { project: { id: { $eq: req.project.id } }, 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        // const accountTitles = await accountTitleRepo.search(searchConditions);
        // res.json(accountTitles);
        const matchStages = [];
        if (typeof ((_d = (_c = searchConditions.project) === null || _c === void 0 ? void 0 : _c.id) === null || _d === void 0 ? void 0 : _d.$eq) === 'string') {
            matchStages.push({
                $match: {
                    'project.id': {
                        // $exists: true,
                        $eq: searchConditions.project.id.$eq
                    }
                }
            });
        }
        if (typeof searchConditions.codeValue === 'string') {
            matchStages.push({
                $match: {
                    'hasCategoryCode.codeValue': {
                        $exists: true,
                        $regex: new RegExp(searchConditions.codeValue)
                    }
                }
            });
        }
        else if (searchConditions.codeValue !== undefined && searchConditions.codeValue !== null) {
            if (typeof searchConditions.codeValue.$eq === 'string') {
                matchStages.push({
                    $match: {
                        'hasCategoryCode.codeValue': {
                            $exists: true,
                            $eq: searchConditions.codeValue.$eq
                        }
                    }
                });
            }
        }
        if (searchConditions.inCodeSet !== undefined) {
            if (typeof searchConditions.inCodeSet.codeValue === 'string') {
                matchStages.push({
                    $match: {
                        codeValue: {
                            $exists: true,
                            $regex: new RegExp(searchConditions.inCodeSet.codeValue)
                        }
                    }
                });
            }
            else if (searchConditions.inCodeSet.codeValue !== undefined && searchConditions.inCodeSet.codeValue !== null) {
                if (typeof searchConditions.inCodeSet.codeValue.$eq === 'string') {
                    matchStages.push({
                        $match: {
                            codeValue: {
                                $exists: true,
                                $eq: searchConditions.inCodeSet.codeValue.$eq
                            }
                        }
                    });
                }
            }
        }
        const nameRegex = searchConditions.name;
        if (typeof nameRegex === 'string') {
            matchStages.push({
                $match: {
                    'hasCategoryCode.name': {
                        $exists: true,
                        $regex: new RegExp(nameRegex)
                    }
                }
            });
        }
        // const totalCountResult = await accountTitleRepo.accountTitleModel.aggregate([
        //     { $unwind: '$hasCategoryCode' },
        //     ...matchStages,
        //     { $count: 'totalCount' }
        // ])
        //     .exec();
        // const totalCount = (Array.isArray(totalCountResult) && totalCountResult.length > 0) ? totalCountResult[0].totalCount : 0;
        const aggregate = accountTitleRepo.accountTitleModel.aggregate([
            { $unwind: '$hasCategoryCode' },
            ...matchStages,
            {
                $project: {
                    _id: 0,
                    codeValue: '$hasCategoryCode.codeValue',
                    name: '$hasCategoryCode.name',
                    inCodeSet: {
                        codeValue: '$codeValue',
                        name: '$name'
                    },
                    inDefinedTermSet: '$hasCategoryCode.inDefinedTermSet',
                    additionalProperty: '$hasCategoryCode.additionalProperty'
                }
            }
        ]);
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (searchConditions.limit !== undefined && searchConditions.page !== undefined) {
            aggregate.limit(searchConditions.limit * searchConditions.page)
                .skip(searchConditions.limit * (searchConditions.page - 1));
        }
        const accountTitles = yield aggregate.exec();
        res.json(accountTitles);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 科目更新
 */
// tslint:disable-next-line:use-default-type-parameter
accountTitlesRouter.put('/accountTitleSet/:codeValue', permitScopes_1.default(['accountTitles.*']), ...[
    express_validator_1.body('codeValue')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('name')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountTitleSet = Object.assign(Object.assign({}, req.body), { codeValue: req.params.codeValue });
        const accountTitleCategory = accountTitleSet.inCodeSet;
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        debug('updating accountTitleSet', accountTitleSet);
        const doc = yield accountTitleRepo.accountTitleModel.findOneAndUpdate({
            'project.id': {
                // $exists: true,
                $eq: accountTitleSet.project.id
            },
            codeValue: accountTitleCategory.codeValue,
            'hasCategoryCode.codeValue': accountTitleSet.codeValue
        }, Object.assign({ 'hasCategoryCode.$[accountTitleSet].name': accountTitleSet.name }, (Array.isArray(accountTitleSet.additionalProperty))
            ? {
                'hasCategoryCode.$[accountTitleSet].additionalProperty': accountTitleSet.additionalProperty
            }
            : undefined), {
            new: true,
            arrayFilters: [
                { 'accountTitleSet.codeValue': accountTitleSet.codeValue }
            ]
        })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound(accountTitleRepo.accountTitleModel.modelName);
        }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 科目削除
 */
// tslint:disable-next-line:use-default-type-parameter
accountTitlesRouter.delete('/accountTitleSet/:codeValue', permitScopes_1.default(['accountTitles.*']), ...[
    express_validator_1.body('project.id')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    express_validator_1.body('inCodeSet.codeValue')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isString()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountTitleSet = Object.assign(Object.assign({}, req.body), { codeValue: req.params.codeValue });
        const accountTitleCategory = accountTitleSet.inCodeSet;
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        const doc = yield accountTitleRepo.accountTitleModel.findOneAndUpdate({
            'project.id': {
                // $exists: true,
                $eq: accountTitleSet.project.id
            },
            codeValue: accountTitleCategory.codeValue,
            'hasCategoryCode.codeValue': {
                $exists: true,
                $eq: accountTitleSet.codeValue
            }
        }, {
            $pull: {
                hasCategoryCode: { codeValue: accountTitleSet.codeValue }
            }
        })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound(accountTitleRepo.accountTitleModel.modelName);
        }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 細目追加
 */
accountTitlesRouter.post('', permitScopes_1.default(['accountTitles.*']), ...[
    express_validator_1.body('codeValue')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('name')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('inCodeSet')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('inCodeSet.codeValue')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('inCodeSet.inCodeSet')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('inCodeSet.inCodeSet.codeValue')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountTitleSet = Object.assign(Object.assign({}, req.body.inCodeSet), { project: { id: req.project.id, typeOf: chevre.factory.organizationType.Project } });
        const accountTitleCategory = Object.assign(Object.assign({}, req.body.inCodeSet.inCodeSet), { project: { id: req.project.id, typeOf: chevre.factory.organizationType.Project } });
        const accountTitle = Object.assign(Object.assign({}, req.body), { project: { id: req.project.id, typeOf: chevre.factory.organizationType.Project } });
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        // 科目の存在確認
        let doc = yield accountTitleRepo.accountTitleModel.findOne({
            'project.id': {
                // $exists: true,
                $eq: req.project.id
            },
            codeValue: accountTitleCategory.codeValue,
            'hasCategoryCode.codeValue': accountTitleSet.codeValue
        })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound('AccountTitleSet');
        }
        const newAccountTitle = {
            project: { id: req.project.id, typeOf: chevre.factory.organizationType.Project },
            typeOf: accountTitle.typeOf,
            codeValue: accountTitle.codeValue,
            name: accountTitle.name,
            additionalProperty: (Array.isArray(accountTitle.additionalProperty)) ? accountTitle.additionalProperty : []
        };
        doc = yield accountTitleRepo.accountTitleModel.findOneAndUpdate({
            'project.id': {
                // $exists: true,
                $eq: req.project.id
            },
            codeValue: accountTitleCategory.codeValue,
            'hasCategoryCode.codeValue': accountTitleSet.codeValue,
            'hasCategoryCode.hasCategoryCode.codeValue': { $ne: accountTitle.codeValue }
        }, {
            $push: {
                'hasCategoryCode.$[accountTitleSet].hasCategoryCode': newAccountTitle
            }
        }, {
            new: true,
            arrayFilters: [
                { 'accountTitleSet.codeValue': accountTitleSet.codeValue }
            ]
        })
            .exec();
        // 存在しなければ細目コード重複
        if (doc === null) {
            throw new chevre.factory.errors.AlreadyInUse('AccountTitle', ['hasCategoryCode.hasCategoryCode.codeValue']);
        }
        res.status(http_status_1.CREATED)
            .json(accountTitle);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 細目検索
 */
accountTitlesRouter.get('', permitScopes_1.default(['accountTitles.*', 'accountTitles', 'accountTitles.read-only']), validator_1.default, 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    try {
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { project: { id: { $eq: req.project.id } }, 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        // const accountTitles = await accountTitleRepo.search(searchConditions);
        // res.json(accountTitles);
        const matchStages = [];
        if (typeof ((_f = (_e = searchConditions.project) === null || _e === void 0 ? void 0 : _e.id) === null || _f === void 0 ? void 0 : _f.$eq) === 'string') {
            matchStages.push({
                $match: {
                    'project.id': {
                        // $exists: true,
                        $eq: searchConditions.project.id.$eq
                    }
                }
            });
        }
        const nameRegex = searchConditions.name;
        if (typeof nameRegex === 'string') {
            matchStages.push({
                $match: {
                    'hasCategoryCode.hasCategoryCode.name': {
                        $exists: true,
                        $regex: new RegExp(nameRegex)
                    }
                }
            });
        }
        if (typeof searchConditions.codeValue === 'string') {
            matchStages.push({
                $match: {
                    'hasCategoryCode.hasCategoryCode.codeValue': {
                        $exists: true,
                        $regex: new RegExp(searchConditions.codeValue)
                    }
                }
            });
        }
        else if (searchConditions.codeValue !== undefined && searchConditions.codeValue !== null) {
            if (typeof searchConditions.codeValue.$eq === 'string') {
                matchStages.push({
                    $match: {
                        'hasCategoryCode.hasCategoryCode.codeValue': {
                            $exists: true,
                            $eq: searchConditions.codeValue.$eq
                        }
                    }
                });
            }
        }
        if (searchConditions.inCodeSet !== undefined) {
            if (typeof searchConditions.inCodeSet.codeValue === 'string') {
                matchStages.push({
                    $match: {
                        'hasCategoryCode.codeValue': {
                            $exists: true,
                            $regex: new RegExp(searchConditions.inCodeSet.codeValue)
                        }
                    }
                });
            }
            else if (searchConditions.inCodeSet.codeValue !== undefined && searchConditions.inCodeSet.codeValue !== null) {
                if (typeof searchConditions.inCodeSet.codeValue.$eq === 'string') {
                    matchStages.push({
                        $match: {
                            'hasCategoryCode.codeValue': {
                                $exists: true,
                                $eq: searchConditions.inCodeSet.codeValue.$eq
                            }
                        }
                    });
                }
            }
            if (searchConditions.inCodeSet.inCodeSet !== undefined) {
                if (typeof searchConditions.inCodeSet.inCodeSet.codeValue === 'string') {
                    matchStages.push({
                        $match: {
                            codeValue: {
                                $exists: true,
                                $regex: new RegExp(searchConditions.inCodeSet.inCodeSet.codeValue)
                            }
                        }
                    });
                }
                else if (searchConditions.inCodeSet.inCodeSet.codeValue !== undefined
                    && searchConditions.inCodeSet.inCodeSet.codeValue !== null) {
                    if (typeof searchConditions.inCodeSet.inCodeSet.codeValue.$eq === 'string') {
                        matchStages.push({
                            $match: {
                                codeValue: {
                                    $exists: true,
                                    $eq: searchConditions.inCodeSet.inCodeSet.codeValue.$eq
                                }
                            }
                        });
                    }
                }
            }
        }
        // const totalCountResult = await accountTitleRepo.accountTitleModel.aggregate([
        //     { $unwind: '$hasCategoryCode' },
        //     { $unwind: '$hasCategoryCode.hasCategoryCode' },
        //     ...matchStages,
        //     { $count: 'totalCount' }
        // ])
        //     .exec();
        // const totalCount = (Array.isArray(totalCountResult) && totalCountResult.length > 0) ? totalCountResult[0].totalCount : 0;
        const aggregate = accountTitleRepo.accountTitleModel.aggregate([
            { $unwind: '$hasCategoryCode' },
            { $unwind: '$hasCategoryCode.hasCategoryCode' },
            ...matchStages,
            {
                $project: {
                    _id: 0,
                    codeValue: '$hasCategoryCode.hasCategoryCode.codeValue',
                    name: '$hasCategoryCode.hasCategoryCode.name',
                    inCodeSet: {
                        codeValue: '$hasCategoryCode.codeValue',
                        name: '$hasCategoryCode.name',
                        inCodeSet: {
                            codeValue: '$codeValue',
                            name: '$name'
                        },
                        inDefinedTermSet: '$hasCategoryCode.inDefinedTermSet'
                    },
                    additionalProperty: '$hasCategoryCode.hasCategoryCode.additionalProperty'
                }
            }
        ]);
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (searchConditions.limit !== undefined && searchConditions.page !== undefined) {
            aggregate.limit(searchConditions.limit * searchConditions.page)
                .skip(searchConditions.limit * (searchConditions.page - 1));
        }
        const accountTitles = yield aggregate.exec();
        res.json(accountTitles);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 細目更新
 */
// tslint:disable-next-line:use-default-type-parameter
accountTitlesRouter.put('/:codeValue', permitScopes_1.default(['accountTitles.*']), ...[
    express_validator_1.body('codeValue')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('name')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('inCodeSet')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('inCodeSet.codeValue')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    try {
        const accountTitle = Object.assign(Object.assign({}, req.body), { codeValue: req.params.codeValue });
        const accountTitleSet = accountTitle.inCodeSet;
        const accountTitleCategory = (_g = accountTitle.inCodeSet) === null || _g === void 0 ? void 0 : _g.inCodeSet;
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        const doc = yield accountTitleRepo.accountTitleModel.findOneAndUpdate({
            'project.id': {
                // $exists: true,
                $eq: accountTitle.project.id
            },
            codeValue: accountTitleCategory.codeValue,
            'hasCategoryCode.codeValue': accountTitleSet.codeValue,
            'hasCategoryCode.hasCategoryCode.codeValue': accountTitle.codeValue
        }, Object.assign(Object.assign({ 'hasCategoryCode.$[accountTitleSet].hasCategoryCode.$[accountTitle].codeValue': accountTitle.codeValue }, (typeof accountTitle.name === 'string')
            ? { 'hasCategoryCode.$[accountTitleSet].hasCategoryCode.$[accountTitle].name': accountTitle.name }
            : undefined), (Array.isArray(accountTitle.additionalProperty))
            ? {
                'hasCategoryCode.$[accountTitleSet].hasCategoryCode.$[accountTitle].additionalProperty': accountTitle.additionalProperty
            }
            : undefined), {
            new: true,
            arrayFilters: [
                { 'accountTitleSet.codeValue': accountTitleSet.codeValue },
                { 'accountTitle.codeValue': accountTitle.codeValue }
            ]
        })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound(accountTitleRepo.accountTitleModel.modelName);
        }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 削除
 */
// tslint:disable-next-line:use-default-type-parameter
accountTitlesRouter.delete('/:codeValue', permitScopes_1.default(['accountTitles.*']), ...[
    express_validator_1.body('project.id')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    express_validator_1.body('inCodeSet.codeValue')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isString(),
    express_validator_1.body('inCodeSet.inCodeSet.codeValue')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isString()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _h;
    try {
        const accountTitle = Object.assign(Object.assign({}, req.body), { codeValue: req.params.codeValue });
        const accountTitleSet = accountTitle.inCodeSet;
        const accountTitleCategory = (_h = accountTitle.inCodeSet) === null || _h === void 0 ? void 0 : _h.inCodeSet;
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        const doc = yield accountTitleRepo.accountTitleModel.findOneAndUpdate({
            'project.id': {
                // $exists: true,
                $eq: accountTitle.project.id
            },
            codeValue: accountTitleCategory.codeValue,
            'hasCategoryCode.codeValue': {
                $exists: true,
                $eq: accountTitleSet.codeValue
            },
            'hasCategoryCode.hasCategoryCode.codeValue': {
                $exists: true,
                $eq: accountTitle.codeValue
            }
        }, {
            $pull: {
                'hasCategoryCode.$[accountTitleSet].hasCategoryCode': {
                    codeValue: accountTitle.codeValue
                }
            }
        }, {
            new: true,
            arrayFilters: [
                { 'accountTitleSet.codeValue': accountTitleSet.codeValue }
            ]
        })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound(accountTitleRepo.accountTitleModel.modelName);
        }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = accountTitlesRouter;
