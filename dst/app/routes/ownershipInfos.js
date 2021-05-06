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
 * 所有権ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
// tslint:disable-next-line:no-implicit-dependencies
// import { ParamsDictionary } from 'express-serve-static-core';
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const ownershipInfosRouter = express_1.Router();
/**
 * 所有権作成
 * 識別子に対して冪等性を確保
 */
ownershipInfosRouter.post('/saveByIdentifier', permitScopes_1.default([]), ...[
    express_validator_1.body('project.id')
        .not()
        .isEmpty()
        .isString(),
    express_validator_1.body('identifier')
        .not()
        .isEmpty()
        .isString(),
    express_validator_1.body('ownedBy')
        .not()
        .isEmpty(),
    express_validator_1.body('ownedFrom')
        .not()
        .isEmpty()
        .isISO8601()
        .toDate(),
    express_validator_1.body('ownedThrough')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.body('typeOfGood')
        .not()
        .isEmpty()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const ownershipInfoRepo = new chevre.repository.OwnershipInfo(mongoose.connection);
        const ownershipInfo = yield ownershipInfoRepo.saveByIdentifier(Object.assign(Object.assign({ id: '', identifier: req.body.identifier, ownedBy: req.body.ownedBy, ownedFrom: req.body.ownedFrom, project: { typeOf: chevre.factory.organizationType.Project, id: (_a = req.body.project) === null || _a === void 0 ? void 0 : _a.id }, typeOf: 'OwnershipInfo', typeOfGood: req.body.typeOfGood }, (req.body.ownedThrough instanceof Date) ? { ownedThrough: req.body.ownedThrough } : undefined), (req.body.acquiredFrom !== undefined && req.body.acquiredFrom !== null)
            ? { acquiredFrom: req.body.acquiredFrom }
            : undefined));
        res.status(http_status_1.CREATED)
            .json(ownershipInfo);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 所有権検索
 */
ownershipInfosRouter.get('', permitScopes_1.default([]), ...[
    express_validator_1.query('project.id.$eq')
        .not()
        .isEmpty()
        .isString(),
    express_validator_1.query('ownedFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('ownedThrough')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('ownedFromGte')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('ownedFromLte')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d;
    try {
        const ownershipInfoRepo = new chevre.repository.OwnershipInfo(mongoose.connection);
        const typeOfGood = (req.query.typeOfGood !== undefined && req.query.typeOfGood !== null) ? req.query.typeOfGood : {};
        let ownershipInfos;
        const searchConditions = Object.assign(Object.assign({}, req.query), { project: { id: { $eq: String((_d = (_c = (_b = req.query) === null || _b === void 0 ? void 0 : _b.project) === null || _c === void 0 ? void 0 : _c.id) === null || _d === void 0 ? void 0 : _d.$eq) } }, 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        switch (typeOfGood.typeOf) {
            default:
                ownershipInfos = yield ownershipInfoRepo.search(searchConditions);
        }
        const countDocuments = req.query.countDocuments === '1';
        if (countDocuments) {
            const totalCount = yield ownershipInfoRepo.count(searchConditions);
            res.set('X-Total-Count', totalCount.toString());
        }
        res.json(ownershipInfos);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 所有権変更
 */
ownershipInfosRouter.put('/updateByIdentifier', permitScopes_1.default([]), ...[
    express_validator_1.body('project.id')
        .not()
        .isEmpty()
        .isString(),
    express_validator_1.body('identifier')
        .not()
        .isEmpty()
        .isString(),
    // body('ownedBy')
    //     .not()
    //     .isEmpty(),
    express_validator_1.body('ownedThrough')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        const ownershipInfoRepo = new chevre.repository.OwnershipInfo(mongoose.connection);
        if (req.body.ownedThrough instanceof Date) {
            yield ownershipInfoRepo.ownershipInfoModel.findOneAndUpdate({
                'project.id': {
                    $exists: true,
                    $eq: (_e = req.body.project) === null || _e === void 0 ? void 0 : _e.id
                },
                identifier: req.body.identifier
            }, { ownedThrough: req.body.ownedThrough }, { new: true })
                .select({ __v: 0, createdAt: 0, updatedAt: 0 })
                .exec();
            // 存在しない場合はいったん保留
            // if (doc !== null) {
            //     throw new chevre.factory.errors.NotFound(ownershipInfoRepo.ownershipInfoModel.modelName);
            // }
        }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = ownershipInfosRouter;
