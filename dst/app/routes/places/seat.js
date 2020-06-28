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
 * 座席ルーター
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
const seatRouter = express_1.Router();
seatRouter.use(authentication_1.default);
/**
 * 作成
 */
seatRouter.post('', permitScopes_1.default(['admin']), ...[
    express_validator_1.body('project')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('branchCode')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    // body('name')
    //     .not()
    //     .isEmpty()
    //     .withMessage(() => 'Required'),
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
    express_validator_1.body('containedInPlace.containedInPlace.containedInPlace.branchCode')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
        .isString(),
    express_validator_1.body('seatingType')
        .optional()
        .isArray(),
    express_validator_1.body('additionalProperty')
        .optional()
        .isArray()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const seat = Object.assign({}, req.body);
        const screeningRoomSection = seat.containedInPlace;
        const screeningRoom = screeningRoomSection.containedInPlace;
        const movieTheater = screeningRoom.containedInPlace;
        const placeRepo = new chevre.repository.Place(mongoose.connection);
        // 劇場の存在確認
        let doc = yield placeRepo.placeModel.findOne({
            'project.id': {
                $exists: true,
                $eq: seat.project.id
            },
            branchCode: movieTheater.branchCode,
            'containsPlace.branchCode': screeningRoom.branchCode,
            'containsPlace.containsPlace.branchCode': screeningRoomSection.branchCode
        })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound('containedInPlace.containedInPlace.containedInPlace');
        }
        doc = yield placeRepo.placeModel.findOneAndUpdate({
            'project.id': {
                $exists: true,
                $eq: seat.project.id
            },
            branchCode: movieTheater.branchCode,
            'containsPlace.branchCode': screeningRoom.branchCode,
            'containsPlace.containsPlace.branchCode': screeningRoomSection.branchCode
        }, {
            $push: {
                'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].containsPlace': {
                    typeOf: seat.typeOf,
                    branchCode: seat.branchCode,
                    seatingType: seat.seatingType,
                    additionalProperty: seat.additionalProperty
                }
            }
        }, {
            new: true,
            arrayFilters: [
                { 'screeningRoom.branchCode': screeningRoom.branchCode },
                {
                    'screeningRoomSection.branchCode': screeningRoomSection.branchCode,
                    'screeningRoomSection.containsPlace.branchCode': { $ne: seat.branchCode }
                }
            ]
        })
            .exec();
        // 存在しなければコード重複
        if (doc === null) {
            throw new chevre.factory.errors.AlreadyInUse(chevre.factory.placeType.Seat, ['branchCode']);
        }
        res.status(http_status_1.CREATED)
            .json(seat);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 座席検索
 */
seatRouter.get('', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const placeRepo = new chevre.repository.Place(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const seats = yield placeRepo.searchSeats(searchConditions);
        res.json(seats);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 更新
 */
// tslint:disable-next-line:use-default-type-parameter
seatRouter.put('/:branchCode', permitScopes_1.default(['admin']), ...[
    express_validator_1.body('project')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    express_validator_1.body('branchCode')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    // body('name')
    //     .not()
    //     .isEmpty()
    //     .withMessage(() => 'Required'),
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
    express_validator_1.body('containedInPlace.containedInPlace.containedInPlace.branchCode')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
        .isString(),
    express_validator_1.body('seatingType')
        .optional()
        .isArray(),
    express_validator_1.body('additionalProperty')
        .optional()
        .isArray()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const seat = Object.assign(Object.assign({}, req.body), { branchCode: req.params.branchCode });
        const $unset = req.body.$unset;
        debug('updating seat', seat, $unset);
        const placeRepo = new chevre.repository.Place(mongoose.connection);
        const screeningRoomSection = seat.containedInPlace;
        const screeningRoom = screeningRoomSection.containedInPlace;
        const movieTheater = screeningRoom.containedInPlace;
        const doc = yield placeRepo.placeModel.findOneAndUpdate({
            'project.id': {
                $exists: true,
                $eq: seat.project.id
            },
            branchCode: movieTheater.branchCode,
            'containsPlace.branchCode': screeningRoom.branchCode,
            'containsPlace.containsPlace.branchCode': screeningRoomSection.branchCode,
            'containsPlace.containsPlace.containsPlace.branchCode': seat.branchCode
        }, Object.assign(Object.assign(Object.assign({ 'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].containsPlace.$[seat].branchCode': seat.branchCode }, (Array.isArray(seat.seatingType))
            ? {
                'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].containsPlace.$[seat].seatingType': seat.seatingType
            }
            : undefined), (Array.isArray(seat.additionalProperty))
            ? {
                'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].containsPlace.$[seat].additionalProperty': seat.additionalProperty
            }
            : undefined), ($unset !== undefined && $unset !== null)
            ? { $unset: req.body.$unset }
            : undefined), {
            new: true,
            arrayFilters: [
                { 'screeningRoom.branchCode': screeningRoom.branchCode },
                { 'screeningRoomSection.branchCode': screeningRoomSection.branchCode },
                { 'seat.branchCode': seat.branchCode }
            ]
        })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound(chevre.factory.placeType.Seat);
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
seatRouter.delete('/:branchCode', permitScopes_1.default(['admin']), ...[
    express_validator_1.body('project')
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
    express_validator_1.body('containedInPlace.containedInPlace.containedInPlace.branchCode')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
        .isString()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const seat = Object.assign(Object.assign({}, req.body), { branchCode: req.params.branchCode });
        const screeningRoomSection = seat.containedInPlace;
        const screeningRoom = screeningRoomSection.containedInPlace;
        const movieTheater = screeningRoom.containedInPlace;
        const placeRepo = new chevre.repository.Place(mongoose.connection);
        const doc = yield placeRepo.placeModel.findOneAndUpdate({
            'project.id': {
                $exists: true,
                $eq: seat.project.id
            },
            branchCode: movieTheater.branchCode,
            'containsPlace.branchCode': screeningRoom.branchCode,
            'containsPlace.containsPlace.branchCode': screeningRoomSection.branchCode,
            'containsPlace.containsPlace.containsPlace.branchCode': seat.branchCode
        }, {
            $pull: {
                'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].containsPlace': {
                    branchCode: seat.branchCode
                }
            }
        }, {
            new: true,
            arrayFilters: [
                { 'screeningRoom.branchCode': screeningRoom.branchCode },
                { 'screeningRoomSection.branchCode': screeningRoomSection.branchCode }
            ]
        })
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound(chevre.factory.placeType.Seat);
        }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = seatRouter;
