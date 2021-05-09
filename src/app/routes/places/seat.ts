/**
 * 座席ルーター
 */
import * as chevre from '@chevre/domain';
import * as createDebug from 'debug';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body } from 'express-validator';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const debug = createDebug('chevre-api:router');

const seatRouter = Router();

/**
 * 作成
 */
seatRouter.post(
    '',
    permitScopes(['places.*']),
    ...[
        body('project')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('branchCode')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        // body('name')
        //     .not()
        //     .isEmpty()
        //     .withMessage(() => 'Required'),
        body('containedInPlace.branchCode')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
            .isString(),
        body('containedInPlace.containedInPlace.branchCode')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
            .isString(),
        body('containedInPlace.containedInPlace.containedInPlace.branchCode')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
            .isString(),
        body('seatingType')
            .optional()
            .isArray(),
        body('additionalProperty')
            .optional()
            .isArray()
    ],
    validator,
    async (req, res, next) => {
        try {
            const seat: chevre.factory.place.seat.IPlace = { ...req.body };

            const screeningRoomSection = <chevre.factory.place.screeningRoomSection.IPlace>seat.containedInPlace;
            const screeningRoom = <chevre.factory.place.screeningRoom.IPlace>screeningRoomSection.containedInPlace;
            const movieTheater = <chevre.factory.place.movieTheater.IPlace>screeningRoom.containedInPlace;

            const placeRepo = new chevre.repository.Place(mongoose.connection);

            // 劇場の存在確認
            let doc = await placeRepo.placeModel.findOne(
                {
                    'project.id': {
                        $exists: true,
                        $eq: seat.project.id
                    },
                    branchCode: movieTheater.branchCode,
                    'containsPlace.branchCode': screeningRoom.branchCode,
                    'containsPlace.containsPlace.branchCode': screeningRoomSection.branchCode
                }
            )
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound('containedInPlace.containedInPlace.containedInPlace');
            }

            doc = await placeRepo.placeModel.findOneAndUpdate(
                {
                    'project.id': {
                        $exists: true,
                        $eq: seat.project.id
                    },
                    branchCode: movieTheater.branchCode,
                    'containsPlace.branchCode': screeningRoom.branchCode,
                    'containsPlace.containsPlace.branchCode': screeningRoomSection.branchCode
                },
                {
                    $push: {
                        'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].containsPlace': {
                            typeOf: seat.typeOf,
                            branchCode: seat.branchCode,
                            seatingType: seat.seatingType,
                            additionalProperty: seat.additionalProperty,
                            ...(seat.name !== undefined && seat.name !== null) ? { name: seat.name } : undefined
                        }
                    }
                },
                <any>{
                    new: true,
                    arrayFilters: [
                        { 'screeningRoom.branchCode': screeningRoom.branchCode },
                        {
                            'screeningRoomSection.branchCode': screeningRoomSection.branchCode,
                            'screeningRoomSection.containsPlace.branchCode': { $ne: seat.branchCode }
                        }
                    ]
                }
            )
                .exec();
            // 存在しなければコード重複
            if (doc === null) {
                throw new chevre.factory.errors.AlreadyInUse(chevre.factory.placeType.Seat, ['branchCode']);
            }

            res.status(CREATED)
                .json(seat);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 座席検索
 */
seatRouter.get(
    '',
    permitScopes(['places.*']),
    validator,
    async (req, res, next) => {
        try {
            const placeRepo = new chevre.repository.Place(mongoose.connection);
            const searchConditions: any = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const seats = await placeRepo.searchSeats(searchConditions);

            res.json(seats);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 更新
 */
// tslint:disable-next-line:use-default-type-parameter
seatRouter.put<ParamsDictionary>(
    '/:branchCode',
    permitScopes(['places.*']),
    ...[
        body('project')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('branchCode')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        // body('name')
        //     .not()
        //     .isEmpty()
        //     .withMessage(() => 'Required'),
        body('containedInPlace.branchCode')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
            .isString(),
        body('containedInPlace.containedInPlace.branchCode')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
            .isString(),
        body('containedInPlace.containedInPlace.containedInPlace.branchCode')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
            .isString(),
        body('seatingType')
            .optional()
            .isArray(),
        body('additionalProperty')
            .optional()
            .isArray()
    ],
    validator,
    async (req, res, next) => {
        try {
            const seat: chevre.factory.place.seat.IPlace = { ...req.body, branchCode: req.params.branchCode };
            const $unset = req.body.$unset;

            debug('updating seat', seat, $unset);
            const placeRepo = new chevre.repository.Place(mongoose.connection);
            const screeningRoomSection = <chevre.factory.place.screeningRoomSection.IPlace>seat.containedInPlace;
            const screeningRoom = <chevre.factory.place.screeningRoom.IPlace>screeningRoomSection.containedInPlace;
            const movieTheater = <chevre.factory.place.movieTheater.IPlace>screeningRoom.containedInPlace;
            const doc = await placeRepo.placeModel.findOneAndUpdate(
                {
                    'project.id': {
                        $exists: true,
                        $eq: seat.project.id
                    },
                    branchCode: movieTheater.branchCode,
                    'containsPlace.branchCode': screeningRoom.branchCode,
                    'containsPlace.containsPlace.branchCode': screeningRoomSection.branchCode,
                    'containsPlace.containsPlace.containsPlace.branchCode': seat.branchCode
                },
                // 限られた属性のみ更新する
                {
                    'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].containsPlace.$[seat].branchCode':
                        seat.branchCode,
                    ...(seat.name !== undefined && seat.name !== null)
                        ? {
                            'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].containsPlace.$[seat].name':
                                seat.name
                        }
                        : undefined,
                    ...(Array.isArray(seat.seatingType))
                        ? {
                            'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].containsPlace.$[seat].seatingType':
                                seat.seatingType
                        }
                        : undefined,
                    ...(Array.isArray(seat.additionalProperty))
                        ? {
                            'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].containsPlace.$[seat].additionalProperty':
                                seat.additionalProperty
                        }
                        : undefined,
                    ...($unset !== undefined && $unset !== null)
                        ? { $unset: req.body.$unset }
                        : undefined
                },
                <any>{
                    new: true,
                    arrayFilters: [
                        { 'screeningRoom.branchCode': screeningRoom.branchCode },
                        { 'screeningRoomSection.branchCode': screeningRoomSection.branchCode },
                        { 'seat.branchCode': seat.branchCode }
                    ]
                }
            )
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound(chevre.factory.placeType.Seat);
            }

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 削除
 */
// tslint:disable-next-line:use-default-type-parameter
seatRouter.delete<ParamsDictionary>(
    '/:branchCode',
    permitScopes(['places.*']),
    ...[
        body('project')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('containedInPlace.branchCode')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
            .isString(),
        body('containedInPlace.containedInPlace.branchCode')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
            .isString(),
        body('containedInPlace.containedInPlace.containedInPlace.branchCode')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
            .isString()
    ],
    validator,
    async (req, res, next) => {
        try {
            const seat: chevre.factory.place.seat.IPlace = { ...req.body, branchCode: req.params.branchCode };

            const screeningRoomSection = <chevre.factory.place.screeningRoomSection.IPlace>seat.containedInPlace;
            const screeningRoom = <chevre.factory.place.screeningRoom.IPlace>screeningRoomSection.containedInPlace;
            const movieTheater = <chevre.factory.place.movieTheater.IPlace>screeningRoom.containedInPlace;

            const placeRepo = new chevre.repository.Place(mongoose.connection);

            const doc = await placeRepo.placeModel.findOneAndUpdate(
                {
                    'project.id': {
                        $exists: true,
                        $eq: seat.project.id
                    },
                    branchCode: movieTheater.branchCode,
                    'containsPlace.branchCode': screeningRoom.branchCode,
                    'containsPlace.containsPlace.branchCode': screeningRoomSection.branchCode,
                    'containsPlace.containsPlace.containsPlace.branchCode': seat.branchCode
                },
                {
                    $pull: {
                        'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].containsPlace': {
                            branchCode: seat.branchCode
                        }
                    }
                },
                <any>{
                    new: true,
                    arrayFilters: [
                        { 'screeningRoom.branchCode': screeningRoom.branchCode },
                        { 'screeningRoomSection.branchCode': screeningRoomSection.branchCode }
                    ]
                }
            )
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound(chevre.factory.placeType.Seat);
            }

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default seatRouter;
