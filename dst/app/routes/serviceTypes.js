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
 * 興行区分ルーター
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
const serviceTypesRouter = express_1.Router();
serviceTypesRouter.use(authentication_1.default);
serviceTypesRouter.post('', permitScopes_1.default(['admin']), ...[
    check_1.body('project')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = Object.assign(Object.assign({}, req.body.project), { typeOf: 'Project' });
        let serviceType = Object.assign(Object.assign({}, req.body), { typeOf: 'ServiceType', id: '', project: project });
        const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
        serviceType = yield serviceTypeRepo.save(serviceType);
        res.status(http_status_1.CREATED)
            .json(serviceType);
    }
    catch (error) {
        next(error);
    }
}));
serviceTypesRouter.get('', permitScopes_1.default(['admin', 'serviceTypes', 'serviceTypes.read-only']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const serviceTypes = yield serviceTypeRepo.search(searchConditions);
        res.json(serviceTypes);
    }
    catch (error) {
        next(error);
    }
}));
serviceTypesRouter.get('/:id', permitScopes_1.default(['admin', 'serviceTypes', 'serviceTypes.read-only']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
        const serviceType = yield serviceTypeRepo.findById({ id: req.params.id });
        res.json(serviceType);
    }
    catch (error) {
        next(error);
    }
}));
serviceTypesRouter.put('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const serviceType = Object.assign(Object.assign({}, req.body), { id: req.params.id });
        const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
        yield serviceTypeRepo.save(serviceType);
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
serviceTypesRouter.delete('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
        yield serviceTypeRepo.deleteById({
            id: req.params.id
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = serviceTypesRouter;
