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
 * 承認ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const MAX_NUM_AUTHORIZATIONS_CREATED = 1000;
const authorizationsRouter = express_1.Router();
/**
 * 承認作成
 */
authorizationsRouter.post('', permitScopes_1.default([]), ...[
    express_validator_1.body()
        .isArray()
        .custom((value) => value.length <= MAX_NUM_AUTHORIZATIONS_CREATED)
        .withMessage(() => 'Array length max exceeded'),
    express_validator_1.body('*.project.id')
        .not()
        .isEmpty()
        .isString(),
    express_validator_1.body('*.code')
        .not()
        .isEmpty()
        .isString(),
    express_validator_1.body('*.object')
        .not()
        .isEmpty(),
    express_validator_1.body('*.validFrom')
        .not()
        .isEmpty()
        .isISO8601()
        .toDate(),
    express_validator_1.body('*.expiresInSeconds')
        .not()
        .isEmpty()
        .isInt()
        .toInt()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authorizationRepo = new chevre.repository.Code(mongoose.connection);
        const authorizations = yield authorizationRepo.save(req.body.map((o) => {
            var _a;
            return {
                project: { typeOf: chevre.factory.organizationType.Project, id: String((_a = o.project) === null || _a === void 0 ? void 0 : _a.id) },
                code: o.code,
                data: o.object,
                validFrom: o.validFrom,
                expiresInSeconds: o.expiresInSeconds
            };
        }));
        res.status(http_status_1.CREATED)
            .json(authorizations);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 承認検索
 */
authorizationsRouter.get('', permitScopes_1.default([]), ...[
    express_validator_1.query('project.id.$eq')
        .not()
        .isEmpty()
        .isString(),
    express_validator_1.query('validFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('validThrough')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const authorizationRepo = new chevre.repository.Code(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { project: { id: { $eq: String((_c = (_b = (_a = req.query) === null || _a === void 0 ? void 0 : _a.project) === null || _b === void 0 ? void 0 : _b.id) === null || _c === void 0 ? void 0 : _c.$eq) } }, 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const authorizations = yield authorizationRepo.search(searchConditions);
        res.json(authorizations);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = authorizationsRouter;
