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
        // const subjectRepo = new chevre.repository.Subject(mongoose.connection);
        // subjects = await subjectRepo.getSubject();
        const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
        const searchConditions = Object.assign({}, req.query);
        // const accountTitles = await accountTitleRepo.search(searchConditions);
        // res.json(accountTitles);
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
    try {
        const subjectAttributes = req.body.attributes;
        // const subject: chevre.factory.subject.ISubjectAttributes = {
        //     subjectClassificationCd: req.body.subjectClassificationCd,
        //     subjectClassificationName: req.body.subjectClassificationName,
        //     subjectCd: req.body.subjectCd,
        //     subjectName: req.body.subjectName,
        //     detailCd: req.body.detailCd,
        //     detailName: req.body.detailName
        // };
        const subjectRepo = new chevre.repository.Subject(mongoose.connection);
        yield subjectRepo.save({
            attributes: subjectAttributes
        });
        res.status(http_status_1.CREATED)
            .json('ok');
    }
    catch (error) {
        next(error);
    }
}));
subjectRouter.get('', permitScopes_1.default(['admin', 'subjects', 'subjects.read-only']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let subjects;
        const subjectRepo = new chevre.repository.Subject(mongoose.connection);
        const searchConditions = {
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
            page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
            sort: req.query.sort,
            detailCd: req.query.detailCd
        };
        subjects = yield subjectRepo.searchSubject(searchConditions);
        res.json(subjects);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 使用していないので不要
 */
// subjectRouter.get(
//     '/:id',
//     permitScopes(['admin', 'subjects', 'subjects.read-only']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const subjectRepo = new chevre.repository.Subject(mongoose.connection);
//             const subject = await subjectRepo.findSubjectById({
//                 id: req.params.id
//             });
//             res.json(subject);
//         } catch (error) {
//             next(error);
//         }
//     }
// );
subjectRouter.put('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subjectRepo = new chevre.repository.Subject(mongoose.connection);
        yield subjectRepo.save({
            id: req.params.id,
            attributes: req.body.attributes
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = subjectRouter;
