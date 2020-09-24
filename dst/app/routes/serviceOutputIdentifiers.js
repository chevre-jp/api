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
 * サービスアウトプット識別子ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const redis = require("../../redis");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const serviceOutputIdentifiersRouter = express_1.Router();
serviceOutputIdentifiersRouter.use(authentication_1.default);
/**
 * サービスアウトプット識別子発行
 */
serviceOutputIdentifiersRouter.post('', permitScopes_1.default(['admin']), ...[
    express_validator_1.body('project.id')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
], validator_1.default, (__, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const identifierRepo = new chevre.repository.ServiceOutputIdentifier(redis.getClient());
        const identifier = yield identifierRepo.publishByTimestamp({
            startDate: new Date()
        });
        res.status(http_status_1.CREATED)
            .json({ identifier });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = serviceOutputIdentifiersRouter;
