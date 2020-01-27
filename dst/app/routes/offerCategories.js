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
const express_1 = require("express");
// tslint:disable-next-line:no-submodule-imports
// import { query } from 'express-validator/check';
// import * as mongoose from 'mongoose';
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const ticketTypeCategories = JSON.parse(process.env.OFFER_CATEGORIES);
const offerCategoriesRouter = express_1.Router();
offerCategoriesRouter.use(authentication_1.default);
/**
 * オファーカテゴリ検索
 */
offerCategoriesRouter.get('', permitScopes_1.default(['admin']), ...[], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectIds = (req.query.project !== undefined && Array.isArray(req.query.project.ids))
            ? req.query.project.ids
            : undefined;
        let categories = ticketTypeCategories;
        if (Array.isArray(projectIds)) {
            categories = ticketTypeCategories.filter((c) => c.project !== undefined && projectIds.indexOf(c.project.id) >= 0);
        }
        res.json(categories);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = offerCategoriesRouter;
