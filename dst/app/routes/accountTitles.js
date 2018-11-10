"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 勘定科目ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const http_status_1 = require("http-status");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const movieRouter = express_1.Router();
movieRouter.use(authentication_1.default);
movieRouter.post('', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountTitle = req.body;
        const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
        yield accountTitleRepo.save(accountTitle);
        res.status(http_status_1.CREATED).json(accountTitle);
    }
    catch (error) {
        next(error);
    }
}));
movieRouter.get('', permitScopes_1.default(['admin', 'accountTitles', 'accountTitles.read-only']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
        const searchCoinditions = Object.assign({}, req.query, { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const totalCount = yield accountTitleRepo.count(searchCoinditions);
        const acconutTitles = yield accountTitleRepo.search(searchCoinditions);
        res.set('X-Total-Count', totalCount.toString());
        res.json(acconutTitles);
    }
    catch (error) {
        next(error);
    }
}));
movieRouter.get('/:identifier', permitScopes_1.default(['admin', 'accountTitles', 'accountTitles.read-only']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
        const accountTitle = yield accountTitleRepo.findMovieByIdentifier({ identifier: req.params.identifier });
        res.json(accountTitle);
    }
    catch (error) {
        next(error);
    }
}));
movieRouter.put('/:identifier', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountTitle = req.body;
        const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
        yield accountTitleRepo.save(accountTitle);
        res.status(http_status_1.NO_CONTENT).end();
    }
    catch (error) {
        next(error);
    }
}));
movieRouter.delete('/:identifier', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
        yield accountTitleRepo.deleteByIdentifier({ identifier: req.params.identifier });
        res.status(http_status_1.NO_CONTENT).end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = movieRouter;
