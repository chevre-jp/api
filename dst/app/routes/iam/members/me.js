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
 * IAMメンバー(me)ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const mongoose = require("mongoose");
const permitScopes_1 = require("../../../middlewares/permitScopes");
const validator_1 = require("../../../middlewares/validator");
const iamMeRouter = express_1.Router();
iamMeRouter.get('', permitScopes_1.default(['iam.members.me.read']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const memberRepo = new chevre.repository.Member(mongoose.connection);
        const members = yield memberRepo.search({
            member: { id: { $eq: req.user.sub } },
            project: { id: { $eq: req.project.id } },
            limit: 1
        });
        if (members.length === 0) {
            throw new chevre.factory.errors.NotFound('Member');
        }
        res.json(members[0]);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = iamMeRouter;
