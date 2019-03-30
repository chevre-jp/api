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
 * 興行区分ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const mongoose = require("mongoose");
const http_status_1 = require("http-status");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const boxOfficeTypesRouter = express_1.Router();
boxOfficeTypesRouter.use(authentication_1.default);
boxOfficeTypesRouter.get('/getBoxOfficeTypeList', permitScopes_1.default(['admin', 'boxOfficeTypes', 'boxOfficeTypes.read-only']), validator_1.default, (__, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
        const searchCoinditions = {
            sort: { _id: chevre.factory.sortType.Ascending }
        };
        const totalCount = yield serviceTypeRepo.count(searchCoinditions);
        const serviceTypes = yield serviceTypeRepo.search(searchCoinditions);
        res.set('X-Total-Count', totalCount.toString());
        res.json(serviceTypes);
    }
    catch (error) {
        next(error);
    }
}));
boxOfficeTypesRouter.get('/search', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
        const searchCoinditions = Object.assign({}, req.query, { ids: (req.query.id !== undefined) ? [req.query.id] : req.query.ids, 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const totalCount = yield serviceTypeRepo.count(searchCoinditions);
        const serviceTypes = yield serviceTypeRepo.search(searchCoinditions);
        res.set('X-Total-Count', totalCount.toString());
        res.json(serviceTypes);
    }
    catch (error) {
        next(error);
    }
}));
boxOfficeTypesRouter.put('/:id', permitScopes_1.default(['admin']), (req, _, next) => {
    req.checkBody('name')
        .exists()
        .withMessage('Required');
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const serviceType = Object.assign({}, req.body, { id: req.params.id });
        const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
        yield serviceTypeRepo.save(serviceType);
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
boxOfficeTypesRouter.post('/add', permitScopes_1.default(['admin']), (req, _, next) => {
    req.checkBody('id')
        .exists()
        .withMessage('Required');
    req.checkBody('name')
        .exists()
        .withMessage('Required');
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const serviceType = Object.assign({}, req.body, { typeOf: 'ServiceType' });
        const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
        yield serviceTypeRepo.save(serviceType);
        res.status(http_status_1.CREATED)
            .json(serviceType);
    }
    catch (error) {
        next(error);
    }
}));
boxOfficeTypesRouter.delete('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
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
exports.default = boxOfficeTypesRouter;
