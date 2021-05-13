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
    express_validator_1.body('url')
        .optional()
        .isURL(),
    express_validator_1.body('paymentAccepted')
        .optional()
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
/**
 * 販売者作成
 */
sellersRouter.post('', permitScopes_1.default(['sellers.*']), ...validations, validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
sellersRouter.get('', permitScopes_1.default(['sellers.*', 'sellers.read']), ...[
    express_validator_1.query('$projection.*')
        .toInt()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const sellerRepo = new chevre.repository.Seller(mongoose.connection);
        let sellers = yield sellerRepo.search(searchConditions, (req.query.$projection !== undefined && req.query.$projection !== null) ? Object.assign({}, req.query.$projection) : undefined);
        // GMOのショップIDだけ補完する(互換性維持対応として)
        const checkingPaymentMethodType = chevre.factory.paymentMethodType.CreditCard;
        if (sellers.length > 0) {
            // クレジットカード決済サービスを取得
            const productRepo = new chevre.repository.Product(mongoose.connection);
            const paymentServices = yield productRepo.search({
                limit: 1,
                project: { id: { $eq: sellers[0].project.id } },
                typeOf: { $eq: chevre.factory.service.paymentService.PaymentServiceType.CreditCard },
                serviceOutput: { typeOf: { $eq: checkingPaymentMethodType } }
            });
            // 存在すれば、ショップIDをpaymentAcceptedに追加
            if (paymentServices.length > 0) {
                const paymentService = paymentServices[0];
                sellers = sellers.map((seller) => {
                    var _a, _b;
                    if (Array.isArray(seller.paymentAccepted)) {
                        const providerCredentials = (_b = (_a = paymentService.provider) === null || _a === void 0 ? void 0 : _a.find((p) => p.id === seller.id)) === null || _b === void 0 ? void 0 : _b.credentials;
                        const shopId = providerCredentials === null || providerCredentials === void 0 ? void 0 : providerCredentials.shopId;
                        const tokenizationCode = providerCredentials === null || providerCredentials === void 0 ? void 0 : providerCredentials.tokenizationCode;
                        if (typeof shopId === 'string' || typeof tokenizationCode === 'string') {
                            seller.paymentAccepted.forEach((payment) => {
                                if (payment.paymentMethodType === checkingPaymentMethodType) {
                                    payment.gmoInfo = { shopId, tokenizationCode };
                                }
                            });
                        }
                    }
                    return seller;
                });
            }
        }
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
sellersRouter.get('/:id', permitScopes_1.default(['sellers.*', 'sellers.read']), ...[
    express_validator_1.query('$projection.*')
        .toInt()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const sellerRepo = new chevre.repository.Seller(mongoose.connection);
        const seller = yield sellerRepo.findById({ id: req.params.id }, (req.query.$projection !== undefined && req.query.$projection !== null) ? Object.assign({}, req.query.$projection) : undefined);
        // GMOのショップIDだけ補完する(互換性維持対応として)
        const checkingPaymentMethodType = chevre.factory.paymentMethodType.CreditCard;
        // クレジットカード決済サービスを取得
        const productRepo = new chevre.repository.Product(mongoose.connection);
        const paymentServices = yield productRepo.search({
            limit: 1,
            project: { id: { $eq: seller.project.id } },
            typeOf: { $eq: chevre.factory.service.paymentService.PaymentServiceType.CreditCard },
            serviceOutput: { typeOf: { $eq: checkingPaymentMethodType } }
        });
        // 存在すれば、ショップIDをpaymentAcceptedに追加
        if (paymentServices.length > 0) {
            const paymentService = paymentServices[0];
            if (Array.isArray(seller.paymentAccepted)) {
                const providerCredentials = (_b = (_a = paymentService.provider) === null || _a === void 0 ? void 0 : _a.find((p) => p.id === seller.id)) === null || _b === void 0 ? void 0 : _b.credentials;
                const shopId = providerCredentials === null || providerCredentials === void 0 ? void 0 : providerCredentials.shopId;
                const tokenizationCode = providerCredentials === null || providerCredentials === void 0 ? void 0 : providerCredentials.tokenizationCode;
                if (typeof shopId === 'string' || typeof tokenizationCode === 'string') {
                    seller.paymentAccepted.forEach((payment) => {
                        if (payment.paymentMethodType === checkingPaymentMethodType) {
                            payment.gmoInfo = { shopId, tokenizationCode };
                        }
                    });
                }
            }
        }
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
sellersRouter.put('/:id', permitScopes_1.default(['sellers.*']), ...validations, validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
sellersRouter.delete('/:id', permitScopes_1.default(['sellers.*']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
