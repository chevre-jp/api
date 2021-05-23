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
 * メンバー(me)ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const mongoose = require("mongoose");
const validator_1 = require("../../middlewares/validator");
const TOKEN_ISSUERS_AS_ADMIN = (typeof process.env.TOKEN_ISSUERS_AS_ADMIN === 'string')
    ? process.env.TOKEN_ISSUERS_AS_ADMIN.split(',')
    : [];
const meRouter = express_1.Router();
/**
 * プロジェクト検索
 * 閲覧権限を持つプロジェクトを検索
 */
meRouter.get('/projects', 
// permitScopes([]),
validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const memberRepo = new chevre.repository.Member(mongoose.connection);
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        // tslint:disable-next-line:no-magic-numbers
        const limit = (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100;
        const page = (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1;
        // 権限を持つプロジェクト検索
        let searchConditions;
        if (TOKEN_ISSUERS_AS_ADMIN.includes(req.user.iss)) {
            // 管理ユーザープールのクライアントであればreq.user.subとして検索
            searchConditions = {
                'member.id': { $eq: req.user.sub }
            };
        }
        else {
            // それ以外であればreq.user.client_idとして検索
            searchConditions = {
                'member.id': { $eq: req.user.client_id }
            };
        }
        const projectMembers = yield memberRepo.memberModel.find(searchConditions, { project: 1 })
            .limit(limit)
            .skip(limit * (page - 1))
            .setOptions({ maxTimeMS: 10000 })
            .exec()
            .then((docs) => docs.map((doc) => doc.toObject()));
        let projectIds = projectMembers.map((m) => m.project.id);
        // length=1だとidsの指定がない検索になってしまうので、ありえないプロジェクトIDで保管
        if (projectIds.length === 0) {
            projectIds = ['***NoProjects***'];
        }
        const projects = yield projectRepo.search({
            ids: projectIds
            // limit: limit
        }, { settings: 0 });
        res.json(projects);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = meRouter;
