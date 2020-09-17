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
 * 販売者ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const authentication_1 = require("../middlewares/authentication");
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
    express_validator_1.body('name.en')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    express_validator_1.body('parentOrganization.typeOf')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    express_validator_1.body('parentOrganization.name.ja')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    express_validator_1.body('parentOrganization.name.en')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    express_validator_1.body('url')
        .optional()
        .isURL(),
    express_validator_1.body('paymentAccepted')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isArray(),
    express_validator_1.body('areaServed')
        .optional()
        .isArray(),
    express_validator_1.body('hasMerchantReturnPolicy')
        .optional()
        .isArray(),
    express_validator_1.body('paymentAccepted')
        .optional()
        .isArray(),
    express_validator_1.body('additionalProperty')
        .optional()
        .isArray()
];
const sellersRouter = express_1.Router();
sellersRouter.use(authentication_1.default);
/**
 * 販売者作成
 */
sellersRouter.post('', permitScopes_1.default(['admin']), ...validations, validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = Object.assign(Object.assign({}, req.body.project), { typeOf: chevre.factory.organizationType.Project });
        const attributes = Object.assign(Object.assign({}, req.body), { project: project });
        const sellerRepo = new chevre.repository.Seller(mongoose.connection);
        const seller = yield sellerRepo.save({ attributes: attributes });
        res.status(http_status_1.CREATED)
            .json(seller);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 販売者検索
 */
sellersRouter.get('', permitScopes_1.default(['admin']), ...[
    express_validator_1.query('$projection.*')
        .toInt()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const sellerRepo = new chevre.repository.Seller(mongoose.connection);
        const sellers = yield sellerRepo.search(searchConditions, (req.query.$projection !== undefined && req.query.$projection !== null) ? Object.assign({}, req.query.$projection) : undefined
        // 管理者以外にセキュアな情報を露出しないように
        // (!req.isAdmin) ? { 'paymentAccepted.gmoInfo.shopPass': 0 } : undefined
        );
        res.set('X-Total-Count', sellers.length.toString());
        res.json(sellers);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * IDで販売者検索
 */
// tslint:disable-next-line:use-default-type-parameter
sellersRouter.get('/:id', permitScopes_1.default(['admin']), ...[
    express_validator_1.query('$projection.*')
        .toInt()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sellerRepo = new chevre.repository.Seller(mongoose.connection);
        const seller = yield sellerRepo.findById({ id: req.params.id }, (req.query.$projection !== undefined && req.query.$projection !== null) ? Object.assign({}, req.query.$projection) : undefined
        // 管理者以外にセキュアな情報を露出しないように
        // (!req.isAdmin) ? { 'paymentAccepted.gmoInfo.shopPass': 0 } : undefined
        );
        res.json(seller);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 販売者更新
 */
// tslint:disable-next-line:use-default-type-parameter
sellersRouter.put('/:id', permitScopes_1.default(['admin']), ...validations, validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const attributes = Object.assign({}, req.body);
        const sellerRepo = new chevre.repository.Seller(mongoose.connection);
        yield sellerRepo.save({ id: req.params.id, attributes: attributes });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 販売者削除
 */
sellersRouter.delete('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sellerRepo = new chevre.repository.Seller(mongoose.connection);
        yield sellerRepo.deleteById({
            id: req.params.id
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = sellersRouter;
