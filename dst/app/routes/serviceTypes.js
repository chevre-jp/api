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
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const serviceTypesRouter = express_1.Router();
serviceTypesRouter.use(authentication_1.default);
serviceTypesRouter.post('', permitScopes_1.default(['admin']), ...[
    check_1.body('project')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    check_1.body('project.id')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
        .isString()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = { id: req.body.project.id, typeOf: 'Project' };
        let categoryCode = Object.assign(Object.assign({}, req.body), { typeOf: 'CategoryCode', inCodeSet: {
                typeOf: 'CategoryCodeSet',
                identifier: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType
            }, name: (typeof req.body.name === 'string')
                ? { ja: req.body.name }
                : req.body.name, project: project });
        const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);
        const doc = yield categoryCodeRepo.categoryCodeModel.create(categoryCode);
        categoryCode = doc.toObject();
        res.status(http_status_1.CREATED)
            .json(Object.assign(Object.assign({}, categoryCode), { identifier: categoryCode.codeValue, name: categoryCode.name.ja }));
    }
    catch (error) {
        next(error);
    }
}));
serviceTypesRouter.get('', permitScopes_1.default(['admin', 'serviceTypes', 'serviceTypes.read-only']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);
        const searchConditions = Object.assign(Object.assign(Object.assign({}, req.query), (typeof req.query.name === 'string' && req.query.name.length > 0)
            ? { name: { $regex: req.query.name } }
            : undefined), { inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType } }, 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const categoryCodes = yield categoryCodeRepo.search(searchConditions);
        res.json(categoryCodes.map((c) => {
            return Object.assign(Object.assign({}, c), { identifier: c.codeValue, name: c.name.ja });
        }));
    }
    catch (error) {
        next(error);
    }
}));
serviceTypesRouter.get('/:id', permitScopes_1.default(['admin', 'serviceTypes', 'serviceTypes.read-only']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);
        const categoryCode = yield categoryCodeRepo.findById({ id: req.params.id });
        res.json(Object.assign(Object.assign({}, categoryCode), { identifier: categoryCode.codeValue, name: categoryCode.name.ja }));
    }
    catch (error) {
        next(error);
    }
}));
serviceTypesRouter.put('/:id', permitScopes_1.default(['admin']), ...[
    check_1.body('project')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    check_1.body('project.id')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
        .isString()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = { id: req.body.project.id, typeOf: 'Project' };
        const categoryCode = Object.assign(Object.assign({}, req.body), { typeOf: 'CategoryCode', inCodeSet: {
                typeOf: 'CategoryCodeSet',
                identifier: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType
            }, name: (typeof req.body.name === 'string')
                ? { ja: req.body.name }
                : req.body.name, project: project });
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
serviceTypesRouter.delete('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
exports.default = serviceTypesRouter;
