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
 * プロジェクトメンバールーター
 */
const chevre = require("@chevre/domain");
const express = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const me_1 = require("./members/me");
const iamMembersRouter = express.Router();
iamMembersRouter.use('/me', me_1.default);
/**
 * プロジェクトメンバー検索
 */
iamMembersRouter.get('', permitScopes_1.default(['iam.members.read']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const searchCoinditions = Object.assign(Object.assign({}, req.query), { project: { id: { $eq: req.project.id } }, 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const memberRepo = new chevre.repository.Member(mongoose.connection);
        const members = yield memberRepo.search(searchCoinditions);
        res.json(members);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * プロジェクトメンバー取得
 */
iamMembersRouter.get('/:id', permitScopes_1.default(['iam.members.read']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const memberRepo = new chevre.repository.Member(mongoose.connection);
        const members = yield memberRepo.search({
            member: { id: { $eq: req.params.id } },
            project: { id: { $eq: req.project.id } },
            limit: 1
        });
        if (members.length === 0) {
            throw new chevre.factory.errors.NotFound(memberRepo.memberModel.modelName);
        }
        res.json(members[0]);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * プロジェクトメンバー更新
 */
// tslint:disable-next-line:use-default-type-parameter
iamMembersRouter.put('/:id', permitScopes_1.default(['iam.members.write']), ...[
    express_validator_1.body('member')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    express_validator_1.body('member.name')
        .optional()
        .isString(),
    express_validator_1.body('member.hasRole')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isArray(),
    express_validator_1.body('member.hasRole.*.roleName')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isString()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const memberRepo = new chevre.repository.Member(mongoose.connection);
        // ロールを作成
        const roles = req.body.member.hasRole.map((r) => {
            return {
                typeOf: 'OrganizationRole',
                roleName: r.roleName,
                memberOf: { typeOf: req.project.typeOf, id: req.project.id }
            };
        });
        const name = (_a = req.body.member) === null || _a === void 0 ? void 0 : _a.name;
        const doc = yield memberRepo.memberModel.findOneAndUpdate({
            'member.id': {
                $eq: req.params.id
            },
            'project.id': {
                $eq: req.project.id
            }
        }, Object.assign({ 'member.hasRole': roles }, (typeof name === 'string') ? { 'member.name': name } : undefined))
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound(memberRepo.memberModel.modelName);
        }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
/**
 * プロジェクトメンバー削除
 */
iamMembersRouter.delete('/:id', permitScopes_1.default(['iam.members.write']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const memberRepo = new chevre.repository.Member(mongoose.connection);
        const doc = yield memberRepo.memberModel.findOneAndDelete({
            'member.id': {
                $eq: req.params.id
            },
            'project.id': {
                $eq: req.project.id
            }
        })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound(memberRepo.memberModel.modelName);
        }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = iamMembersRouter;
