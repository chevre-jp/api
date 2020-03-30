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
 * カテゴリーコードルーター
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
const categoryCodesRouter = express_1.Router();
/**
 * カテゴリーコードに対するバリデーション
 */
const validations = [
    check_1.body('project')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    check_1.body('project.id')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
        .isString(),
    check_1.body('codeValue')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
        .isString(),
    check_1.body('inCodeSet')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    check_1.body('inCodeSet.identifier')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
        .isString()
];
categoryCodesRouter.use(authentication_1.default);
categoryCodesRouter.post('', permitScopes_1.default(['admin']), ...validations, validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = { id: req.body.project.id, typeOf: 'Project' };
        let categoryCode = Object.assign(Object.assign({}, req.body), { project: project });
        const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);
        const doc = yield categoryCodeRepo.categoryCodeModel.create(categoryCode);
        categoryCode = doc.toObject();
        res.status(http_status_1.CREATED)
            .json(categoryCode);
    }
    catch (error) {
        next(error);
    }
}));
categoryCodesRouter.get('', permitScopes_1.default(['admin']), ...[
    check_1.query('limit')
        .optional()
        .isInt()
        .toInt(),
    check_1.query('page')
        .optional()
        .isInt()
        .toInt()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const categoryCodes = yield categoryCodeRepo.search(searchConditions);
        res.json(categoryCodes);
    }
    catch (error) {
        next(error);
    }
}));
categoryCodesRouter.get('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);
        const categoryCode = yield categoryCodeRepo.findById({ id: req.params.id });
        res.json(categoryCode);
    }
    catch (error) {
        next(error);
    }
}));
categoryCodesRouter.put('/:id', permitScopes_1.default(['admin']), ...validations, validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = { id: req.body.project.id, typeOf: 'Project' };
        const categoryCode = Object.assign(Object.assign({}, req.body), { project: project });
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
categoryCodesRouter.delete('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
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
exports.default = categoryCodesRouter;
