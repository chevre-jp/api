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
 * 配給ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const mongoose = require("mongoose");
const http_status_1 = require("http-status");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const distributorsRouter = express_1.Router();
distributorsRouter.use(authentication_1.default);
distributorsRouter.get('/list', permitScopes_1.default(['admin']), validator_1.default, (_, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
        const distributions = yield distributionRepo.getDistributions();
        res.json(distributions.map((d) => {
            return Object.assign(Object.assign({}, d), { distributorType: d.id });
        }));
    }
    catch (error) {
        next(error);
    }
}));
distributorsRouter.get('/search', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const distributions = yield distributionRepo.searchDistributions(searchConditions);
        res.json(distributions.map((d) => {
            return Object.assign(Object.assign({}, d), { distributorType: d.id, name: (typeof d.name === 'string')
                    ? d.name
                    : (d.name !== undefined && d.name !== null) ? d.name.ja : undefined });
        }));
    }
    catch (error) {
        next(error);
    }
}));
distributorsRouter.put('/:id', permitScopes_1.default(['admin']), (req, _, next) => {
    req.checkBody('name')
        .exists()
        .withMessage('Required');
    next();
}, validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
        yield distributionRepo.updateDistribution({
            id: req.params.id,
            name: req.body.name
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
distributorsRouter.post('/add', permitScopes_1.default(['admin']), (req, _, next) => {
    req.checkBody('id')
        .exists()
        .withMessage('Required');
    req.checkBody('name')
        .exists()
        .withMessage('Required');
    next();
}, validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
        const distributor = yield distributionRepo.createDistribution({
            id: req.body.id,
            name: req.body.name
        });
        res.status(http_status_1.CREATED)
            .json(Object.assign(Object.assign({}, distributor), { distributorType: distributor.id, name: (typeof distributor.name === 'string')
                ? distributor.name
                : (distributor.name !== undefined && distributor.name !== null) ? distributor.name.ja : undefined }));
    }
    catch (error) {
        next(error);
    }
}));
distributorsRouter.delete('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
        yield distributionRepo.deleteById({
            id: req.params.id
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = distributorsRouter;
