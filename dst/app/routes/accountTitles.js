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
 * 勘定科目ルーター
 */
const chevre = require("@chevre/domain");
const createDebug = require("debug");
const express_1 = require("express");
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const debug = createDebug('chevre-api:router');
const accountTitlesRouter = express_1.Router();
accountTitlesRouter.use(authentication_1.default);
/**
 * 科目分類追加
 */
accountTitlesRouter.post('/accountTitleCategory', permitScopes_1.default(['admin']), ...[
    check_1.body('project')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('codeValue')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('name')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const project = Object.assign({}, req.body.project, { typeOf: 'Project' });
        const accountTitle = Object.assign({}, req.body, { project: project });
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
accountTitlesRouter.get('/accountTitleCategory', permitScopes_1.default(['admin', 'accountTitles', 'accountTitles.read-only']), validator_1.default, 
// tslint:disable-next-line:max-func-body-length
(req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        const searchCoinditions = Object.assign({}, req.query, { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        // const totalCount = await accountTitleRepo.count(searchCoinditions);
        // const accountTitles = await accountTitleRepo.search(searchCoinditions);
        // res.set('X-Total-Count', totalCount.toString());
        // res.json(accountTitles);
        const conditions = [
            { typeOf: 'AccountTitle' }
        ];
        if (searchCoinditions.project !== undefined) {
            if (Array.isArray(searchCoinditions.project.ids)) {
                conditions.push({
                    'project.id': {
                        $exists: true,
                        $in: searchCoinditions.project.ids
                    }
                });
            }
        }
        if (searchCoinditions.codeValue !== undefined) {
            conditions.push({
                codeValue: {
                    $exists: true,
                    $regex: new RegExp(searchCoinditions.codeValue, 'i')
                }
            });
        }
        const totalCount = yield accountTitleRepo.accountTitleModel.countDocuments({ $and: conditions })
            .setOptions({ maxTimeMS: 10000 })
            .exec();
        const query = accountTitleRepo.accountTitleModel.find({ $and: conditions }, {
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
            hasCategoryCode: 0
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
        const accountTitles = yield query.setOptions({ maxTimeMS: 10000 })
            .exec()
            .then((docs) => docs.map((doc) => doc.toObject()));
        res.set('X-Total-Count', totalCount.toString());
        res.json(accountTitles);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 科目分類更新
 */
accountTitlesRouter.put('/accountTitleCategory/:codeValue', permitScopes_1.default(['admin']), ...[
    check_1.body('codeValue')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('name')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountTitle = Object.assign({}, req.body, { codeValue: req.params.codeValue });
        delete accountTitle.inCodeSet;
        delete accountTitle.hasCategoryCode;
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        const doc = yield accountTitleRepo.accountTitleModel.findOneAndUpdate({ codeValue: accountTitle.codeValue }, accountTitle, { new: true })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound('AccountTitle');
        }
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
accountTitlesRouter.post('/accountTitleSet', permitScopes_1.default(['admin']), ...[
    check_1.body('codeValue')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('name')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('inCodeSet')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('inCodeSet.codeValue')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountTitleCategory = req.body.inCodeSet;
        const accountTitle = req.body;
        delete accountTitle.inCodeSet;
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        // 科目分類の存在確認
        let doc = yield accountTitleRepo.accountTitleModel.findOne({ codeValue: accountTitleCategory.codeValue })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound('AccountTitleCategory');
        }
        debug('creating accountTitleSet', accountTitle);
        doc = yield accountTitleRepo.accountTitleModel.findOneAndUpdate({
            codeValue: accountTitleCategory.codeValue,
            'hasCategoryCode.codeValue': { $ne: accountTitle.codeValue }
        }, { $push: { hasCategoryCode: accountTitle } }, { new: true })
            .exec();
        // 存在しなければ科目コード重複
        if (doc === null) {
            throw new chevre.factory.errors.AlreadyInUse('AccountTitle', ['hasCategoryCode.codeValue']);
        }
        res.status(http_status_1.CREATED)
            .json(accountTitle);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 科目検索
 */
accountTitlesRouter.get('/accountTitleSet', permitScopes_1.default(['admin', 'accountTitles', 'accountTitles.read-only']), validator_1.default, 
// tslint:disable-next-line:max-func-body-length
(req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        const searchCoinditions = Object.assign({}, req.query, { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        // const totalCount = await accountTitleRepo.count(searchCoinditions);
        // const accountTitles = await accountTitleRepo.search(searchCoinditions);
        // res.set('X-Total-Count', totalCount.toString());
        // res.json(accountTitles);
        const matchStages = [];
        if (searchCoinditions.project !== undefined) {
            if (Array.isArray(searchCoinditions.project.ids)) {
                matchStages.push({
                    $match: {
                        'project.id': {
                            $exists: true,
                            $in: searchCoinditions.project.ids
                        }
                    }
                });
            }
        }
        if (searchCoinditions.codeValue !== undefined) {
            matchStages.push({
                $match: {
                    'hasCategoryCode.codeValue': {
                        $exists: true,
                        $regex: new RegExp(searchCoinditions.codeValue, 'i')
                    }
                }
            });
        }
        if (searchCoinditions.inCodeSet !== undefined) {
            if (searchCoinditions.inCodeSet.codeValue !== undefined) {
                matchStages.push({
                    $match: {
                        codeValue: {
                            $exists: true,
                            $regex: new RegExp(searchCoinditions.inCodeSet.codeValue, 'i')
                        }
                    }
                });
            }
        }
        const totalCountResult = yield accountTitleRepo.accountTitleModel.aggregate([
            { $unwind: '$hasCategoryCode' },
            ...matchStages,
            { $count: 'totalCount' }
        ])
            .exec();
        const totalCount = (Array.isArray(totalCountResult) && totalCountResult.length > 0) ? totalCountResult[0].totalCount : 0;
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
        if (searchCoinditions.limit !== undefined && searchCoinditions.page !== undefined) {
            aggregate.limit(searchCoinditions.limit * searchCoinditions.page)
                .skip(searchCoinditions.limit * (searchCoinditions.page - 1));
        }
        const accountTitles = yield aggregate.exec();
        res.set('X-Total-Count', totalCount.toString());
        res.json(accountTitles);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 科目更新
 */
accountTitlesRouter.put('/accountTitleSet/:codeValue', permitScopes_1.default(['admin']), ...[
    check_1.body('codeValue')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('name')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountTitle = Object.assign({}, req.body, { codeValue: req.params.codeValue });
        delete accountTitle.inCodeSet;
        delete accountTitle.hasCategoryCode;
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        debug('updating accountTitleSet', accountTitle);
        const doc = yield accountTitleRepo.accountTitleModel.findOneAndUpdate({ 'hasCategoryCode.codeValue': accountTitle.codeValue }, {
            'hasCategoryCode.$.name': accountTitle.name,
            'hasCategoryCode.$.description': accountTitle.description,
            'hasCategoryCode.$.inDefinedTermSet': accountTitle.inDefinedTermSet,
            'hasCategoryCode.$.additionalProperty': accountTitle.additionalProperty
        }, { new: true })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound('AccountTitle');
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
accountTitlesRouter.post('', permitScopes_1.default(['admin']), ...[
    check_1.body('codeValue')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('name')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('inCodeSet')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('inCodeSet.codeValue')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('inCodeSet.inCodeSet')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('inCodeSet.inCodeSet.codeValue')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountTitleSet = req.body.inCodeSet;
        const accountTitleCategory = req.body.inCodeSet.inCodeSet;
        const accountTitle = req.body;
        delete accountTitle.inCodeSet;
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        // 科目の存在確認
        let doc = yield accountTitleRepo.accountTitleModel.findOne({
            codeValue: accountTitleCategory.codeValue,
            'hasCategoryCode.codeValue': accountTitleSet.codeValue
        })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound('AccountTitleSet');
        }
        doc = yield accountTitleRepo.accountTitleModel.findOneAndUpdate({
            codeValue: accountTitleCategory.codeValue,
            'hasCategoryCode.codeValue': accountTitleSet.codeValue,
            'hasCategoryCode.hasCategoryCode.codeValue': { $ne: accountTitle.codeValue }
        }, { $push: { 'hasCategoryCode.$.hasCategoryCode': accountTitle } }, { new: true })
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
accountTitlesRouter.get('', permitScopes_1.default(['admin', 'accountTitles', 'accountTitles.read-only']), validator_1.default, 
// tslint:disable-next-line:max-func-body-length
(req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        const searchCoinditions = Object.assign({}, req.query, { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        // const totalCount = await accountTitleRepo.count(searchCoinditions);
        // const accountTitles = await accountTitleRepo.search(searchCoinditions);
        // res.set('X-Total-Count', totalCount.toString());
        // res.json(accountTitles);
        const matchStages = [];
        if (searchCoinditions.project !== undefined) {
            if (Array.isArray(searchCoinditions.project.ids)) {
                matchStages.push({
                    $match: {
                        'project.id': {
                            $exists: true,
                            $in: searchCoinditions.project.ids
                        }
                    }
                });
            }
        }
        if (searchCoinditions.codeValue !== undefined) {
            matchStages.push({
                $match: {
                    'hasCategoryCode.hasCategoryCode.codeValue': {
                        $exists: true,
                        $regex: new RegExp(searchCoinditions.codeValue, 'i')
                    }
                }
            });
        }
        if (searchCoinditions.inCodeSet !== undefined) {
            if (searchCoinditions.inCodeSet.codeValue !== undefined) {
                matchStages.push({
                    $match: {
                        'hasCategoryCode.codeValue': {
                            $exists: true,
                            $regex: new RegExp(searchCoinditions.inCodeSet.codeValue, 'i')
                        }
                    }
                });
            }
            if (searchCoinditions.inCodeSet.inCodeSet !== undefined) {
                if (searchCoinditions.inCodeSet.inCodeSet.codeValue !== undefined) {
                    matchStages.push({
                        $match: {
                            codeValue: {
                                $exists: true,
                                $regex: new RegExp(searchCoinditions.inCodeSet.inCodeSet.codeValue, 'i')
                            }
                        }
                    });
                }
            }
        }
        const totalCountResult = yield accountTitleRepo.accountTitleModel.aggregate([
            { $unwind: '$hasCategoryCode' },
            { $unwind: '$hasCategoryCode.hasCategoryCode' },
            ...matchStages,
            { $count: 'totalCount' }
        ])
            .exec();
        const totalCount = (Array.isArray(totalCountResult) && totalCountResult.length > 0) ? totalCountResult[0].totalCount : 0;
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
        if (searchCoinditions.limit !== undefined && searchCoinditions.page !== undefined) {
            aggregate.limit(searchCoinditions.limit * searchCoinditions.page)
                .skip(searchCoinditions.limit * (searchCoinditions.page - 1));
        }
        const accountTitles = yield aggregate.exec();
        res.set('X-Total-Count', totalCount.toString());
        res.json(accountTitles);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 細目更新
 */
accountTitlesRouter.put('/:codeValue', permitScopes_1.default(['admin']), ...[
    check_1.body('codeValue')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('name')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('inCodeSet')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('inCodeSet.codeValue')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountTitleSet = req.body.inCodeSet;
        const accountTitle = Object.assign({}, req.body, { codeValue: req.params.codeValue });
        delete accountTitle.inCodeSet;
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        const doc = yield accountTitleRepo.accountTitleModel.findOneAndUpdate({
            'hasCategoryCode.hasCategoryCode.codeValue': accountTitle.codeValue
        }, { 'hasCategoryCode.$[element].hasCategoryCode.$': accountTitle }, {
            new: true,
            arrayFilters: [{ 'element.codeValue': accountTitleSet.codeValue }]
        })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound('AccountTitle');
        }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = accountTitlesRouter;
