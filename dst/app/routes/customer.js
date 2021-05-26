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
 * 顧客ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
/**
 * 販売者に対するバリデーション
 */
const validations = [
    express_validator_1.body('project.id')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('typeOf')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    express_validator_1.body('name.ja')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    express_validator_1.body('url')
        .optional()
        .isURL(),
    express_validator_1.body('contactPoint')
        .optional()
        .isArray(),
    express_validator_1.body('additionalProperty')
        .optional()
        .isArray()
];
const customersRouter = express_1.Router();
/**
 * 顧客作成
 */
customersRouter.post('', permitScopes_1.default(['customers.*']), ...validations, validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = { id: req.body.project.id, typeOf: chevre.factory.organizationType.Project };
        const attributes = Object.assign(Object.assign({}, req.body), { project: project });
        const customerRepo = new chevre.repository.Customer(mongoose.connection);
        const customer = yield customerRepo.save({ attributes: attributes });
        res.status(http_status_1.CREATED)
            .json(customer);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 顧客検索
 */
customersRouter.get('', permitScopes_1.default(['customers.*', 'customers.read']), ...[
    express_validator_1.query('$projection.*')
        .toInt()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const searchConditions = Object.assign(Object.assign({}, req.query), { project: { id: { $eq: req.project.id } }, 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const customerRepo = new chevre.repository.Customer(mongoose.connection);
        const customers = yield customerRepo.search(searchConditions, (req.query.$projection !== undefined && req.query.$projection !== null) ? Object.assign({}, req.query.$projection) : undefined);
        res.json(customers);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * IDで顧客検索
 */
// tslint:disable-next-line:use-default-type-parameter
customersRouter.get('/:id', permitScopes_1.default(['customers.*', 'customers.read']), ...[
    express_validator_1.query('$projection.*')
        .toInt()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customerRepo = new chevre.repository.Customer(mongoose.connection);
        const customer = yield customerRepo.findById({ id: req.params.id }, (req.query.$projection !== undefined && req.query.$projection !== null) ? Object.assign({}, req.query.$projection) : undefined);
        res.json(customer);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 顧客更新
 */
// tslint:disable-next-line:use-default-type-parameter
customersRouter.put('/:id', permitScopes_1.default(['customers.*']), ...validations, validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const attributes = Object.assign({}, req.body);
        const customerRepo = new chevre.repository.Customer(mongoose.connection);
        yield customerRepo.save({ id: req.params.id, attributes: attributes });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 顧客削除
 */
customersRouter.delete('/:id', permitScopes_1.default(['customers.*']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customerRepo = new chevre.repository.Customer(mongoose.connection);
        yield customerRepo.deleteById({
            id: req.params.id
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = customersRouter;
