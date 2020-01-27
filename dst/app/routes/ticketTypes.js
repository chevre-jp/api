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
 * オファールーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const ticketTypesRouter = express_1.Router();
ticketTypesRouter.use(authentication_1.default);
ticketTypesRouter.post('', permitScopes_1.default(['admin']), ...[
    check_1.body('project')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerRepo = new chevre.repository.Offer(mongoose.connection);
        const project = Object.assign(Object.assign({}, req.body.project), { typeOf: 'Project' });
        const ticketType = yield offerRepo.saveTicketType(Object.assign(Object.assign({}, req.body), { id: '', project: project }));
        res.status(http_status_1.CREATED)
            .json(ticketType);
    }
    catch (error) {
        next(error);
    }
}));
ticketTypesRouter.get('', permitScopes_1.default(['admin', 'ticketTypes', 'ticketTypes.read-only']), ...[
    check_1.query('priceSpecification.minPrice')
        .optional()
        .isInt()
        .toInt(),
    check_1.query('priceSpecification.maxPrice')
        .optional()
        .isInt()
        .toInt(),
    check_1.query('priceSpecification.accounting.minAccountsReceivable')
        .optional()
        .isInt()
        .toInt(),
    check_1.query('priceSpecification.accounting.maxAccountsReceivable')
        .optional()
        .isInt()
        .toInt(),
    check_1.query('priceSpecification.referenceQuantity.value')
        .optional()
        .isInt()
        .toInt()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerRepo = new chevre.repository.Offer(mongoose.connection);
        const searchCoinditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const offers = yield offerRepo.searchTicketTypes(searchCoinditions);
        res.json(offers);
    }
    catch (error) {
        next(error);
    }
}));
ticketTypesRouter.get('/:id', permitScopes_1.default(['admin', 'ticketTypes', 'ticketTypes.read-only']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerRepo = new chevre.repository.Offer(mongoose.connection);
        const ticketType = yield offerRepo.findTicketTypeById({ id: req.params.id });
        res.json(ticketType);
    }
    catch (error) {
        next(error);
    }
}));
ticketTypesRouter.put('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerRepo = new chevre.repository.Offer(mongoose.connection);
        yield offerRepo.saveTicketType(req.body);
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
ticketTypesRouter.delete('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerRepo = new chevre.repository.Offer(mongoose.connection);
        yield offerRepo.deleteTicketType({ id: req.params.id });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = ticketTypesRouter;
