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
 * 興行区分ルーター
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
subjectRouter.get('/getSubjectList', permitScopes_1.default(['admin', 'subjects', 'subjects.read-only']), validator_1.default, (__, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subjectRepo = new chevre.repository.Subject(mongoose.connection);
        const subjects = yield subjectRepo.getSubject();
        res.json(subjects);
    }
    catch (error) {
        next(error);
    }
}));
subjectRouter.post('', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
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
            attributes: req.body.attributes
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
        const subjectRepo = new chevre.repository.Subject(mongoose.connection);
        const searchConditions = {
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
            page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
            sort: req.query.sort,
            detailCd: req.query.detailCd
        };
        const totalCount = yield subjectRepo.countSubject(searchConditions);
        const subject = yield subjectRepo.searchSubject(searchConditions);
        res.set('X-Total-Count', totalCount.toString());
        res.json(subject);
    }
    catch (error) {
        next(error);
    }
}));
subjectRouter.get('/:id', permitScopes_1.default(['admin', 'subjects', 'subjects.read-only']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subjectRepo = new chevre.repository.Subject(mongoose.connection);
        const subject = yield subjectRepo.findSubjectById({
            id: req.params.id
        });
        res.json(subject);
    }
    catch (error) {
        next(error);
    }
}));
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
