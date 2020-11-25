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
 * スクリーンルーター
 */
const chevre = require("@chevre/domain");
const createDebug = require("debug");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const authentication_1 = require("../../middlewares/authentication");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const debug = createDebug('chevre-api:router');
const screeningRoomRouter = express_1.Router();
screeningRoomRouter.use(authentication_1.default);
/**
 * 作成
 */
screeningRoomRouter.post('', permitScopes_1.default(['admin']), ...[
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
    express_validator_1.body('additionalProperty')
        .optional()
        .isArray(),
    express_validator_1.body('openSeatingAllowed')
        .optional()
        .isBoolean()
        .toBoolean()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const screeningRoom = Object.assign({}, req.body);
        const placeRepo = new chevre.repository.Place(mongoose.connection);
        // 劇場の存在確認
        let doc = yield placeRepo.placeModel.findOne({
            'project.id': {
                $exists: true,
                $eq: screeningRoom.project.id
            },
            branchCode: screeningRoom.containedInPlace.branchCode
        })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound('containedInPlace');
        }
        doc = yield placeRepo.placeModel.findOneAndUpdate({
            'project.id': {
                $exists: true,
                $eq: screeningRoom.project.id
            },
            branchCode: screeningRoom.containedInPlace.branchCode,
            'containsPlace.branchCode': { $ne: screeningRoom.branchCode }
        }, {
            $push: {
                containsPlace: {
                    typeOf: screeningRoom.typeOf,
                    branchCode: screeningRoom.branchCode,
                    name: screeningRoom.name,
                    address: screeningRoom.address,
                    additionalProperty: screeningRoom.additionalProperty
                }
            }
        }, { new: true })
            .exec();
        // 存在しなければコード重複
        if (doc === null) {
            throw new chevre.factory.errors.AlreadyInUse(chevre.factory.placeType.ScreeningRoom, ['branchCode']);
        }
        res.status(http_status_1.CREATED)
            .json(screeningRoom);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 検索
 */
screeningRoomRouter.get('', permitScopes_1.default(['admin']), ...[
    express_validator_1.query('openSeatingAllowed')
        .optional()
        .isBoolean()
        .toBoolean()
], validator_1.default, 
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
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
        // 劇場ID
        const containedInPlaceIdEq = (_b = (_a = searchConditions.containedInPlace) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.$eq;
        if (typeof containedInPlaceIdEq === 'string') {
            matchStages.push({
                $match: {
                    _id: {
                        $eq: mongoose.Types.ObjectId(containedInPlaceIdEq)
                    }
                }
            });
        }
        if (searchConditions.containedInPlace !== undefined) {
            // 劇場コード
            if (searchConditions.containedInPlace.branchCode !== undefined) {
                if (typeof searchConditions.containedInPlace.branchCode.$eq === 'string') {
                    matchStages.push({
                        $match: {
                            branchCode: {
                                $exists: true,
                                $eq: searchConditions.containedInPlace.branchCode.$eq
                            }
                        }
                    });
                }
            }
        }
        // スクリーンコード
        if (searchConditions.branchCode !== undefined) {
            if (typeof searchConditions.branchCode.$eq === 'string') {
                matchStages.push({
                    $match: {
                        'containsPlace.branchCode': {
                            $exists: true,
                            $eq: searchConditions.branchCode.$eq
                        }
                    }
                });
            }
        }
        const branchCodeRegex = (_c = searchConditions.branchCode) === null || _c === void 0 ? void 0 : _c.$regex;
        if (typeof branchCodeRegex === 'string') {
            matchStages.push({
                $match: {
                    'containsPlace.branchCode': {
                        $exists: true,
                        $regex: new RegExp(branchCodeRegex)
                    }
                }
            });
        }
        const nameCodeRegex = (_d = searchConditions.name) === null || _d === void 0 ? void 0 : _d.$regex;
        if (typeof nameCodeRegex === 'string') {
            matchStages.push({
                $match: {
                    $or: [
                        {
                            'containsPlace.name.ja': {
                                $exists: true,
                                $regex: new RegExp(nameCodeRegex)
                            }
                        },
                        {
                            'containsPlace.name.en': {
                                $exists: true,
                                $regex: new RegExp(nameCodeRegex)
                            }
                        }
                    ]
                }
            });
        }
        const openSeatingAllowed = searchConditions.openSeatingAllowed;
        if (typeof openSeatingAllowed === 'boolean') {
            matchStages.push({
                $match: {
                    'containsPlace.openSeatingAllowed': {
                        $exists: true,
                        $eq: openSeatingAllowed
                    }
                }
            });
        }
        const aggregate = placeRepo.placeModel.aggregate([
            { $unwind: '$containsPlace' },
            ...matchStages,
            {
                $project: {
                    _id: 0,
                    typeOf: '$containsPlace.typeOf',
                    branchCode: '$containsPlace.branchCode',
                    name: '$containsPlace.name',
                    address: '$containsPlace.address',
                    containedInPlace: {
                        id: '$_id',
                        typeOf: '$typeOf',
                        branchCode: '$branchCode',
                        name: '$name'
                    },
                    openSeatingAllowed: '$containsPlace.openSeatingAllowed',
                    additionalProperty: '$containsPlace.additionalProperty'
                }
            }
        ]);
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (searchConditions.limit !== undefined && searchConditions.page !== undefined) {
            aggregate.limit(searchConditions.limit * searchConditions.page)
                .skip(searchConditions.limit * (searchConditions.page - 1));
        }
        const screeningRooms = yield aggregate.exec();
        res.json(screeningRooms);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 更新
 */
// tslint:disable-next-line:use-default-type-parameter
screeningRoomRouter.put('/:branchCode', permitScopes_1.default(['admin']), ...[
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
    express_validator_1.body('additionalProperty')
        .optional()
        .isArray(),
    express_validator_1.body('openSeatingAllowed')
        .optional()
        .isBoolean()
        .toBoolean()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const screeningRoom = Object.assign(Object.assign({}, req.body), { branchCode: req.params.branchCode });
        const $unset = req.body.$unset;
        const placeRepo = new chevre.repository.Place(mongoose.connection);
        debug('updating screeningRoom', screeningRoom);
        debug(typeof screeningRoom.openSeatingAllowed);
        const doc = yield placeRepo.placeModel.findOneAndUpdate({
            'project.id': {
                $exists: true,
                $eq: screeningRoom.project.id
            },
            branchCode: screeningRoom.containedInPlace.branchCode,
            'containsPlace.branchCode': screeningRoom.branchCode
        }, Object.assign(Object.assign(Object.assign(Object.assign({ 'containsPlace.$[screeningRoom].name': screeningRoom.name }, (screeningRoom.address !== undefined && screeningRoom.address !== null)
            ? { 'containsPlace.$[screeningRoom].address': screeningRoom.address }
            : undefined), (typeof screeningRoom.openSeatingAllowed === 'boolean')
            ? { 'containsPlace.$[screeningRoom].openSeatingAllowed': screeningRoom.openSeatingAllowed }
            : undefined), (Array.isArray(screeningRoom.additionalProperty))
            ? { 'containsPlace.$[screeningRoom].additionalProperty': screeningRoom.additionalProperty }
            : undefined), ($unset !== undefined && $unset !== null)
            ? { $unset: req.body.$unset }
            : undefined), {
            new: true,
            arrayFilters: [
                { 'screeningRoom.branchCode': screeningRoom.branchCode }
            ]
        })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound(chevre.factory.placeType.ScreeningRoom);
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
screeningRoomRouter.delete('/:branchCode', permitScopes_1.default(['admin']), ...[
    express_validator_1.body('project')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('containedInPlace.branchCode')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
        .isString()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const screeningRoom = Object.assign(Object.assign({}, req.body), { branchCode: req.params.branchCode });
        const placeRepo = new chevre.repository.Place(mongoose.connection);
        const doc = yield placeRepo.placeModel.findOneAndUpdate({
            'project.id': {
                $exists: true,
                $eq: screeningRoom.project.id
            },
            branchCode: screeningRoom.containedInPlace.branchCode,
            'containsPlace.branchCode': screeningRoom.branchCode
        }, {
            $pull: {
                containsPlace: { branchCode: screeningRoom.branchCode }
            }
        })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound(chevre.factory.placeType.ScreeningRoom);
        }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = screeningRoomRouter;
