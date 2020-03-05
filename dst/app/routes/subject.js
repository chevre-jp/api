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
 * @deprecated Use /accountTitles
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const subjectRouter = express_1.Router();
subjectRouter.use(authentication_1.default);
subjectRouter.get('/getSubjectList', permitScopes_1.default(['admin', 'subjects', 'subjects.read-only']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        let subjects;
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        const searchConditions = Object.assign({}, req.query);
        const matchStages = [];
        matchStages.push({
            $match: {
                'project.id': {
                    $exists: true,
                    $eq: (_b = (_a = searchConditions.project) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.$eq
                }
            }
        });
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
        const accountTitles = yield aggregate.exec();
        subjects = accountTitles.map((accountTitle) => {
            var _a, _b, _c, _d, _e, _f;
            return {
                id: accountTitle.codeValue,
                subjectClassificationCd: (_b = (_a = accountTitle.inCodeSet) === null || _a === void 0 ? void 0 : _a.inCodeSet) === null || _b === void 0 ? void 0 : _b.codeValue,
                subjectClassificationName: (_d = (_c = accountTitle.inCodeSet) === null || _c === void 0 ? void 0 : _c.inCodeSet) === null || _d === void 0 ? void 0 : _d.name,
                subjectCd: (_e = accountTitle.inCodeSet) === null || _e === void 0 ? void 0 : _e.codeValue,
                subjectName: (_f = accountTitle.inCodeSet) === null || _f === void 0 ? void 0 : _f.name,
                detailCd: accountTitle.codeValue,
                detailName: accountTitle.name
            };
        });
        res.json(subjects);
    }
    catch (error) {
        next(error);
    }
}));
subjectRouter.post('', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const accountTitle = {
            project: req.body.attributes.project,
            typeOf: 'AccountTitle',
            codeValue: req.body.attributes.detailCd,
            name: req.body.attributes.detailName,
            inCodeSet: {
                project: req.body.attributes.project,
                typeOf: 'AccountTitle',
                codeValue: req.body.attributes.subjectCd,
                name: req.body.attributes.subjectName,
                inCodeSet: {
                    project: req.body.attributes.project,
                    typeOf: 'AccountTitle',
                    codeValue: req.body.attributes.subjectClassificationCd,
                    name: req.body.attributes.subjectClassificationName
                }
            }
        };
        const accountTitleSet = accountTitle.inCodeSet;
        const accountTitleCategory = (_c = accountTitle.inCodeSet) === null || _c === void 0 ? void 0 : _c.inCodeSet;
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
        }, {
            $push: {
                'hasCategoryCode.$[accountTitleSet].hasCategoryCode': {
                    typeOf: accountTitle.typeOf,
                    codeValue: accountTitle.codeValue,
                    name: accountTitle.name,
                    additionalProperty: []
                }
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
            .json('ok');
    }
    catch (error) {
        next(error);
    }
}));
subjectRouter.get('', permitScopes_1.default(['admin', 'subjects', 'subjects.read-only']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e;
    try {
        let subjects;
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const matchStages = [];
        matchStages.push({
            $match: {
                'project.id': {
                    $exists: true,
                    $eq: (_e = (_d = searchConditions.project) === null || _d === void 0 ? void 0 : _d.id) === null || _e === void 0 ? void 0 : _e.$eq
                }
            }
        });
        if (typeof searchConditions.detailCd === 'string') {
            matchStages.push({
                $match: {
                    'hasCategoryCode.hasCategoryCode.codeValue': {
                        $exists: true,
                        $regex: new RegExp(searchConditions.detailCd)
                    }
                }
            });
        }
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
        subjects = accountTitles.map((accountTitle) => {
            var _a, _b, _c, _d, _e, _f;
            return {
                id: accountTitle.codeValue,
                subjectClassificationCd: (_b = (_a = accountTitle.inCodeSet) === null || _a === void 0 ? void 0 : _a.inCodeSet) === null || _b === void 0 ? void 0 : _b.codeValue,
                subjectClassificationName: (_d = (_c = accountTitle.inCodeSet) === null || _c === void 0 ? void 0 : _c.inCodeSet) === null || _d === void 0 ? void 0 : _d.name,
                subjectCd: (_e = accountTitle.inCodeSet) === null || _e === void 0 ? void 0 : _e.codeValue,
                subjectName: (_f = accountTitle.inCodeSet) === null || _f === void 0 ? void 0 : _f.name,
                detailCd: accountTitle.codeValue,
                detailName: accountTitle.name
            };
        });
        res.json(subjects);
    }
    catch (error) {
        next(error);
    }
}));
subjectRouter.put('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    try {
        const accountTitle = {
            project: req.body.attributes.project,
            typeOf: 'AccountTitle',
            codeValue: req.body.attributes.detailCd,
            name: req.body.attributes.detailName,
            inCodeSet: {
                project: req.body.attributes.project,
                typeOf: 'AccountTitle',
                codeValue: req.body.attributes.subjectCd,
                name: req.body.attributes.subjectName,
                inCodeSet: {
                    project: req.body.attributes.project,
                    typeOf: 'AccountTitle',
                    codeValue: req.body.attributes.subjectClassificationCd,
                    name: req.body.attributes.subjectClassificationName
                }
            }
        };
        const accountTitleSet = accountTitle.inCodeSet;
        const accountTitleCategory = (_f = accountTitle.inCodeSet) === null || _f === void 0 ? void 0 : _f.inCodeSet;
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        const doc = yield accountTitleRepo.accountTitleModel.findOneAndUpdate({
            codeValue: accountTitleCategory.codeValue,
            'hasCategoryCode.codeValue': accountTitleSet.codeValue,
            'hasCategoryCode.hasCategoryCode.codeValue': accountTitle.codeValue
        }, Object.assign(Object.assign(Object.assign({ 'hasCategoryCode.$[accountTitleSet].hasCategoryCode.$[accountTitle].codeValue': accountTitle.codeValue }, (typeof accountTitle.name === 'string')
            ? { 'hasCategoryCode.$[accountTitleSet].hasCategoryCode.$[accountTitle].name': accountTitle.name }
            : undefined), (typeof accountTitleSet.name === 'string')
            ? { 'hasCategoryCode.$[accountTitleSet].name': accountTitleSet.name }
            : undefined), (typeof accountTitleCategory.name === 'string')
            ? { name: accountTitleCategory.name }
            : undefined), {
            new: true,
            arrayFilters: [
                { 'accountTitleSet.codeValue': accountTitleSet.codeValue },
                { 'accountTitle.codeValue': accountTitle.codeValue }
            ]
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
exports.default = subjectRouter;
