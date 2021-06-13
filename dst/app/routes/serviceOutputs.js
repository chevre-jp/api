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
 * サービスアウトプットルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const redis = require("../../redis");
const MAX_NUM_IDENTIFIERS_CREATED = 100;
const serviceOutputsRouter = express_1.Router();
/**
 * 検索
 */
serviceOutputsRouter.get('', permitScopes_1.default(['serviceOutputs', 'serviceOutputs.read-only']), ...[
    express_validator_1.query('limit')
        .optional()
        .isInt()
        .toInt(),
    express_validator_1.query('page')
        .optional()
        .isInt()
        .toInt()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const serviceOutputRepo = new chevre.repository.ServiceOutput(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { project: { id: { $eq: req.project.id } }, 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const serviceOutputs = yield serviceOutputRepo.search(searchConditions);
        res.json(serviceOutputs);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * サービスアウトプット識別子発行
 */
serviceOutputsRouter.post('/identifier', permitScopes_1.default([]), ...[
    express_validator_1.body()
        .isArray({ min: 1, max: MAX_NUM_IDENTIFIERS_CREATED })
        .withMessage(() => `must be an array <= ${MAX_NUM_IDENTIFIERS_CREATED}`),
    express_validator_1.body('*.project.id')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const identifierRepo = new chevre.repository.ServiceOutputIdentifier(redis.getClient());
        const identifiers = yield Promise.all(req.body.map(() => __awaiter(void 0, void 0, void 0, function* () {
            const identifier = yield identifierRepo.publishByTimestamp({ startDate: new Date() });
            return { identifier };
        })));
        res.status(http_status_1.CREATED)
            .json(identifiers);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = serviceOutputsRouter;
