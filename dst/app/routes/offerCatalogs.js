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
 * オファーカタログルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const offerCatalogsRouter = express_1.Router();
offerCatalogsRouter.post('', permitScopes_1.default(['offerCatalogs.*']), ...[
    express_validator_1.body('project')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
        const project = Object.assign(Object.assign({}, req.body.project), { typeOf: chevre.factory.organizationType.Project });
        const ticketTypeGroup = yield offerCatalogRepo.save(Object.assign(Object.assign({}, req.body), { id: '', project: project }));
        res.status(http_status_1.CREATED)
            .json(ticketTypeGroup);
    }
    catch (error) {
        next(error);
    }
}));
offerCatalogsRouter.get('', permitScopes_1.default(['offerCatalogs.*']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { project: { id: { $eq: req.project.id } }, 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const ticketTypeGroups = yield offerCatalogRepo.search(searchConditions);
        res.json(ticketTypeGroups);
    }
    catch (error) {
        next(error);
    }
}));
offerCatalogsRouter.get('/:id', permitScopes_1.default(['offerCatalogs.*']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
        const ticketTypeGroup = yield offerCatalogRepo.findById({ id: req.params.id });
        res.json(ticketTypeGroup);
    }
    catch (error) {
        next(error);
    }
}));
offerCatalogsRouter.put('/:id', permitScopes_1.default(['offerCatalogs.*']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerCatalog = req.body;
        const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
        yield offerCatalogRepo.save(offerCatalog);
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
offerCatalogsRouter.delete('/:id', permitScopes_1.default(['offerCatalogs.*']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
        yield offerCatalogRepo.deleteById({ id: req.params.id });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = offerCatalogsRouter;
