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
 * 券種グループルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const http_status_1 = require("http-status");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const ticketTypeGroupsRouter = express_1.Router();
ticketTypeGroupsRouter.use(authentication_1.default);
ticketTypeGroupsRouter.post('', permitScopes_1.default(['admin']), (_, __, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const ticketTypeGroup = req.body;
        const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
        yield ticketTypeRepo.createTicketTypeGroup(ticketTypeGroup);
        res.status(http_status_1.CREATED).json(ticketTypeGroup);
    }
    catch (error) {
        next(error);
    }
}));
ticketTypeGroupsRouter.get('', permitScopes_1.default(['admin', 'ticketTypeGroups', 'ticketTypeGroups.read-only']), (_, __, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
        const searchCoinditions = Object.assign({}, req.query, { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const totalCount = yield ticketTypeRepo.countTicketTypeGroups(searchCoinditions);
        const ticketTypeGroups = yield ticketTypeRepo.searchTicketTypeGroups(searchCoinditions);
        res.set('X-Total-Count', totalCount.toString());
        res.json(ticketTypeGroups);
    }
    catch (error) {
        next(error);
    }
}));
ticketTypeGroupsRouter.get('/:id', permitScopes_1.default(['admin', 'ticketTypeGroups', 'ticketTypeGroups.read-only']), (_, __, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
        const ticketTypeGroup = yield ticketTypeRepo.findTicketTypeGroupById({ id: req.params.id });
        res.json(ticketTypeGroup);
    }
    catch (error) {
        next(error);
    }
}));
ticketTypeGroupsRouter.put('/:id', permitScopes_1.default(['admin']), (_, __, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const ticketTypeGroup = req.body;
        const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
        yield ticketTypeRepo.updateTicketTypeGroup(ticketTypeGroup);
        res.status(http_status_1.NO_CONTENT).end();
    }
    catch (error) {
        next(error);
    }
}));
ticketTypeGroupsRouter.delete('/:id', permitScopes_1.default(['admin']), (_, __, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
        yield ticketTypeRepo.deleteTicketTypeGroup({ id: req.params.id });
        res.status(http_status_1.NO_CONTENT).end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = ticketTypeGroupsRouter;
