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
 * スクリーンセクションルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const screeningRoomSectionRouter = express_1.Router();
/**
 * 作成
 */
screeningRoomSectionRouter.post('', permitScopes_1.default([]), ...[
    express_validator_1.body('project')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('branchCode')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('name')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('containedInPlace.branchCode')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
        .isString(),
    express_validator_1.body('containedInPlace.containedInPlace.branchCode')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
        .isString(),
    express_validator_1.body('additionalProperty')
        .optional()
        .isArray()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const screeningRoomSection = Object.assign({}, req.body);
        const screeningRoom = screeningRoomSection.containedInPlace;
        const movieTheater = screeningRoom.containedInPlace;
        const placeRepo = new chevre.repository.Place(mongoose.connection);
        // 劇場の存在確認
        let doc = yield placeRepo.placeModel.findOne({
            'project.id': {
                $exists: true,
                $eq: screeningRoomSection.project.id
            },
            branchCode: movieTheater.branchCode,
            'containsPlace.branchCode': screeningRoom.branchCode
        })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound('containedInPlace.containedInPlace');
        }
        doc = yield placeRepo.placeModel.findOneAndUpdate({
            'project.id': {
                $exists: true,
                $eq: screeningRoomSection.project.id
            },
            branchCode: movieTheater.branchCode,
            'containsPlace.branchCode': screeningRoom.branchCode
            // 'containsPlace.containsPlace.branchCode': { $ne: screeningRoomSection.branchCode }
        }, {
            $push: {
                'containsPlace.$[screeningRoom].containsPlace': {
                    typeOf: screeningRoomSection.typeOf,
                    branchCode: screeningRoomSection.branchCode,
                    name: screeningRoomSection.name,
                    additionalProperty: screeningRoomSection.additionalProperty
                }
            }
        }, {
            new: true,
            arrayFilters: [
                {
                    'screeningRoom.branchCode': screeningRoom.branchCode,
                    'screeningRoom.containsPlace.branchCode': { $ne: screeningRoomSection.branchCode }
                }
            ]
        })
            .exec();
        // 存在しなければコード重複
        if (doc === null) {
            throw new chevre.factory.errors.AlreadyInUse(chevre.factory.placeType.ScreeningRoomSection, ['branchCode']);
        }
        res.status(http_status_1.CREATED)
            .json(screeningRoomSection);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 検索
 */
screeningRoomSectionRouter.get('', permitScopes_1.default([]), ...[
    express_validator_1.query('$projection.*')
        .toInt()
], validator_1.default, 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        const placeRepo = new chevre.repository.Place(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const matchStages = [];
        if (searchConditions.project !== undefined) {
            if (searchConditions.project.id !== undefined) {
                if (typeof searchConditions.project.id.$eq === 'string') {
                    matchStages.push({
                        $match: {
                            'project.id': {
                                $exists: true,
                                $eq: searchConditions.project.id.$eq
                            }
                        }
                    });
                }
            }
        }
        // 劇場コード
        const movieTheaterBranchCodeEq = (_c = (_b = (_a = searchConditions.containedInPlace) === null || _a === void 0 ? void 0 : _a.containedInPlace) === null || _b === void 0 ? void 0 : _b.branchCode) === null || _c === void 0 ? void 0 : _c.$eq;
        if (typeof movieTheaterBranchCodeEq === 'string') {
            matchStages.push({
                $match: {
                    branchCode: {
                        $exists: true,
                        $eq: movieTheaterBranchCodeEq
                    }
                }
            });
        }
        // スクリーンコード
        const containedInPlaceBranchCodeEq = (_e = (_d = searchConditions.containedInPlace) === null || _d === void 0 ? void 0 : _d.branchCode) === null || _e === void 0 ? void 0 : _e.$eq;
        if (typeof containedInPlaceBranchCodeEq === 'string') {
            matchStages.push({
                $match: {
                    'containsPlace.branchCode': {
                        $exists: true,
                        $eq: containedInPlaceBranchCodeEq
                    }
                }
            });
        }
        // セクションコード
        const sectionBranchCodeEq = (_f = searchConditions === null || searchConditions === void 0 ? void 0 : searchConditions.branchCode) === null || _f === void 0 ? void 0 : _f.$eq;
        if (typeof sectionBranchCodeEq === 'string') {
            matchStages.push({
                $match: {
                    'containsPlace.containsPlace.branchCode': {
                        $exists: true,
                        $eq: sectionBranchCodeEq
                    }
                }
            });
        }
        const nameCodeRegex = (_g = searchConditions.name) === null || _g === void 0 ? void 0 : _g.$regex;
        if (typeof nameCodeRegex === 'string') {
            matchStages.push({
                $match: {
                    $or: [
                        {
                            'containsPlace.containsPlace.name.ja': {
                                $exists: true,
                                $regex: new RegExp(nameCodeRegex)
                            }
                        },
                        {
                            'containsPlace.containsPlace.name.en': {
                                $exists: true,
                                $regex: new RegExp(nameCodeRegex)
                            }
                        }
                    ]
                }
            });
        }
        const branchCodeRegex = (_h = searchConditions.branchCode) === null || _h === void 0 ? void 0 : _h.$regex;
        if (typeof branchCodeRegex === 'string') {
            matchStages.push({
                $match: {
                    'containsPlace.containsPlace.branchCode': {
                        $exists: true,
                        $regex: new RegExp(branchCodeRegex)
                    }
                }
            });
        }
        const aggregate = placeRepo.placeModel.aggregate([
            { $unwind: '$containsPlace' },
            { $unwind: '$containsPlace.containsPlace' },
            ...matchStages,
            {
                $project: Object.assign({ _id: 0, typeOf: '$containsPlace.containsPlace.typeOf', branchCode: '$containsPlace.containsPlace.branchCode', name: '$containsPlace.containsPlace.name', containedInPlace: {
                        typeOf: '$containsPlace.typeOf',
                        branchCode: '$containsPlace.branchCode',
                        name: '$containsPlace.name',
                        containedInPlace: {
                            id: '$_id',
                            typeOf: '$typeOf',
                            branchCode: '$branchCode',
                            name: '$name'
                        }
                    }, additionalProperty: '$containsPlace.containsPlace.additionalProperty' }, (((_j = req.query.$projection) === null || _j === void 0 ? void 0 : _j.seatCount) === 1)
                    ? {
                        seatCount: {
                            $cond: {
                                if: { $isArray: '$containsPlace.containsPlace.containsPlace' },
                                then: { $size: '$containsPlace.containsPlace.containsPlace' },
                                else: 0
                            }
                        }
                    }
                    : undefined)
            }
        ]);
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (searchConditions.limit !== undefined && searchConditions.page !== undefined) {
            aggregate.limit(searchConditions.limit * searchConditions.page)
                .skip(searchConditions.limit * (searchConditions.page - 1));
        }
        const screeningRoomSections = yield aggregate.exec();
        res.json(screeningRoomSections);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 更新
 */
// tslint:disable-next-line:use-default-type-parameter
screeningRoomSectionRouter.put('/:branchCode', permitScopes_1.default([]), ...[
    express_validator_1.body('project')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('branchCode')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('name')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('containedInPlace.branchCode')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
        .isString(),
    express_validator_1.body('containedInPlace.containedInPlace.branchCode')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
        .isString(),
    express_validator_1.body('additionalProperty')
        .optional()
        .isArray()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const screeningRoomSection = Object.assign(Object.assign({}, req.body), { branchCode: req.params.branchCode });
        const $unset = req.body.$unset;
        const placeRepo = new chevre.repository.Place(mongoose.connection);
        const screeningRoom = screeningRoomSection.containedInPlace;
        const movieTheater = screeningRoom.containedInPlace;
        const doc = yield placeRepo.placeModel.findOneAndUpdate({
            'project.id': {
                $exists: true,
                $eq: screeningRoomSection.project.id
            },
            branchCode: movieTheater.branchCode,
            'containsPlace.branchCode': screeningRoom.branchCode,
            'containsPlace.containsPlace.branchCode': screeningRoomSection.branchCode
        }, Object.assign(Object.assign(Object.assign(Object.assign({ 'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].branchCode': screeningRoomSection.branchCode }, (screeningRoomSection.name !== undefined && screeningRoomSection !== null)
            ? {
                'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].name': screeningRoomSection.name
            }
            : undefined), (Array.isArray(screeningRoomSection.additionalProperty))
            ? {
                'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].additionalProperty': screeningRoomSection.additionalProperty
            }
            : undefined), (Array.isArray(screeningRoomSection.containsPlace) && screeningRoomSection.containsPlace.length > 0)
            ? {
                'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].containsPlace': screeningRoomSection.containsPlace.map((p) => {
                    return Object.assign(Object.assign({ typeOf: p.typeOf, branchCode: p.branchCode }, (p.name !== undefined && p.name !== null) ? { name: p.name } : undefined), { seatingType: p.seatingType, additionalProperty: p.additionalProperty });
                })
            }
            : undefined), ($unset !== undefined && $unset !== null)
            ? { $unset: req.body.$unset }
            : undefined), {
            new: true,
            arrayFilters: [
                { 'screeningRoom.branchCode': screeningRoom.branchCode },
                { 'screeningRoomSection.branchCode': screeningRoomSection.branchCode }
            ]
        })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound(chevre.factory.placeType.ScreeningRoomSection);
        }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 削除
 */
// tslint:disable-next-line:use-default-type-parameter
screeningRoomSectionRouter.delete('/:branchCode', permitScopes_1.default([]), ...[
    express_validator_1.body('project')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('branchCode')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('containedInPlace.branchCode')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
        .isString(),
    express_validator_1.body('containedInPlace.containedInPlace.branchCode')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
        .isString()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const screeningRoomSection = Object.assign(Object.assign({}, req.body), { branchCode: req.params.branchCode });
        const screeningRoom = screeningRoomSection.containedInPlace;
        const movieTheater = screeningRoom.containedInPlace;
        const placeRepo = new chevre.repository.Place(mongoose.connection);
        const doc = yield placeRepo.placeModel.findOneAndUpdate({
            'project.id': {
                $exists: true,
                $eq: screeningRoomSection.project.id
            },
            branchCode: movieTheater.branchCode,
            'containsPlace.branchCode': screeningRoom.branchCode,
            'containsPlace.containsPlace.branchCode': screeningRoomSection.branchCode
        }, {
            $pull: {
                'containsPlace.$[screeningRoom].containsPlace': {
                    branchCode: screeningRoomSection.branchCode
                }
            }
        }, {
            new: true,
            arrayFilters: [
                { 'screeningRoom.branchCode': screeningRoom.branchCode }
            ]
        })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound(chevre.factory.placeType.ScreeningRoomSection);
        }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = screeningRoomSectionRouter;
