/**
 * スクリーンセクションルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, query } from 'express-validator';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const screeningRoomSectionRouter = Router();

/**
 * 作成
 */
screeningRoomSectionRouter.post(
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
        body('name')
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
        body('additionalProperty')
            .optional()
            .isArray()
    ],
    validator,
    async (req, res, next) => {
        try {
            const screeningRoomSection: chevre.factory.place.screeningRoomSection.IPlace = {
                ...req.body,
                project: { id: req.project.id, typeOf: chevre.factory.organizationType.Project }
            };

            const screeningRoom = <chevre.factory.place.screeningRoom.IPlace>screeningRoomSection.containedInPlace;
            const movieTheater = <chevre.factory.place.movieTheater.IPlace>screeningRoom.containedInPlace;

            const placeRepo = new chevre.repository.Place(mongoose.connection);

            // 劇場の存在確認
            let doc = await placeRepo.placeModel.findOne(
                {
                    'project.id': {
                        $exists: true,
                        $eq: screeningRoomSection.project.id
                    },
                    branchCode: movieTheater.branchCode,
                    'containsPlace.branchCode': screeningRoom.branchCode
                }
            )
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound('containedInPlace.containedInPlace');
            }

            doc = await placeRepo.placeModel.findOneAndUpdate(
                {
                    'project.id': {
                        $exists: true,
                        $eq: screeningRoomSection.project.id
                    },
                    branchCode: movieTheater.branchCode,
                    'containsPlace.branchCode': screeningRoom.branchCode
                    // 'containsPlace.containsPlace.branchCode': { $ne: screeningRoomSection.branchCode }
                },
                {
                    $push: {
                        'containsPlace.$[screeningRoom].containsPlace': {
                            typeOf: screeningRoomSection.typeOf,
                            branchCode: screeningRoomSection.branchCode,
                            name: screeningRoomSection.name,
                            additionalProperty: screeningRoomSection.additionalProperty
                        }
                    }
                },
                <any>{
                    new: true,
                    arrayFilters: [
                        {
                            'screeningRoom.branchCode': screeningRoom.branchCode,
                            'screeningRoom.containsPlace.branchCode': { $ne: screeningRoomSection.branchCode }
                        }
                    ]
                }
            )
                .exec();
            // 存在しなければコード重複
            if (doc === null) {
                throw new chevre.factory.errors.AlreadyInUse(chevre.factory.placeType.ScreeningRoomSection, ['branchCode']);
            }

            res.status(CREATED)
                .json(screeningRoomSection);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 検索
 */
screeningRoomSectionRouter.get(
    '',
    permitScopes(['places.*', 'places.read']),
    ...[
        query('$projection.*')
            .toInt()
    ],
    validator,
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res, next) => {
        try {
            const placeRepo = new chevre.repository.Place(mongoose.connection);
            const searchConditions: chevre.factory.place.screeningRoomSection.ISearchConditions = {
                ...req.query,
                project: { id: { $eq: req.project.id } },
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const matchStages: any[] = [];
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
            const movieTheaterBranchCodeEq = searchConditions.containedInPlace?.containedInPlace?.branchCode?.$eq;
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
            const containedInPlaceBranchCodeEq = searchConditions.containedInPlace?.branchCode?.$eq;
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
            const sectionBranchCodeEq = searchConditions?.branchCode?.$eq;
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

            const nameCodeRegex = searchConditions.name?.$regex;
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

            const branchCodeRegex = searchConditions.branchCode?.$regex;
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
                    $project: {
                        _id: 0,
                        typeOf: '$containsPlace.containsPlace.typeOf',
                        branchCode: '$containsPlace.containsPlace.branchCode',
                        name: '$containsPlace.containsPlace.name',
                        containedInPlace: {
                            typeOf: '$containsPlace.typeOf',
                            branchCode: '$containsPlace.branchCode',
                            name: '$containsPlace.name',
                            containedInPlace: {
                                id: '$_id',
                                typeOf: '$typeOf',
                                branchCode: '$branchCode',
                                name: '$name'
                            }
                        },
                        additionalProperty: '$containsPlace.containsPlace.additionalProperty',
                        ...(req.query.$projection?.seatCount === 1)
                            ? {
                                seatCount: {
                                    $cond: {
                                        if: { $isArray: '$containsPlace.containsPlace.containsPlace' },
                                        then: { $size: '$containsPlace.containsPlace.containsPlace' },
                                        else: 0
                                    }
                                }
                            }
                            : undefined
                    }
                }
            ]);

            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore else */
            if (searchConditions.limit !== undefined && searchConditions.page !== undefined) {
                aggregate.limit(searchConditions.limit * searchConditions.page)
                    .skip(searchConditions.limit * (searchConditions.page - 1));
            }

            const screeningRoomSections = await aggregate.exec();

            res.json(screeningRoomSections);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 更新
 */
// tslint:disable-next-line:use-default-type-parameter
screeningRoomSectionRouter.put<ParamsDictionary>(
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
        body('name')
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
        body('additionalProperty')
            .optional()
            .isArray()
    ],
    validator,
    async (req, res, next) => {
        try {
            const screeningRoomSection: chevre.factory.place.screeningRoomSection.IPlace
                = { ...req.body, branchCode: req.params.branchCode };
            const $unset = req.body.$unset;

            const placeRepo = new chevre.repository.Place(mongoose.connection);

            const screeningRoom = <chevre.factory.place.screeningRoom.IPlace>screeningRoomSection.containedInPlace;
            const movieTheater = <chevre.factory.place.movieTheater.IPlace>screeningRoom.containedInPlace;
            const doc = await placeRepo.placeModel.findOneAndUpdate(
                {
                    'project.id': {
                        $exists: true,
                        $eq: screeningRoomSection.project.id
                    },
                    branchCode: movieTheater.branchCode,
                    'containsPlace.branchCode': screeningRoom.branchCode,
                    'containsPlace.containsPlace.branchCode': screeningRoomSection.branchCode
                },
                // 限られた属性のみ更新する
                {
                    'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].branchCode':
                        screeningRoomSection.branchCode,
                    ...(screeningRoomSection.name !== undefined && screeningRoomSection !== null)
                        ? {
                            'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].name':
                                screeningRoomSection.name
                        }
                        : undefined,
                    ...(Array.isArray(screeningRoomSection.additionalProperty))
                        ? {
                            'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].additionalProperty':
                                screeningRoomSection.additionalProperty
                        }
                        : undefined,
                    ...(Array.isArray(screeningRoomSection.containsPlace) && screeningRoomSection.containsPlace.length > 0)
                        ? {
                            'containsPlace.$[screeningRoom].containsPlace.$[screeningRoomSection].containsPlace':
                                screeningRoomSection.containsPlace.map((p) => {
                                    return {
                                        typeOf: p.typeOf,
                                        branchCode: p.branchCode,
                                        ...(p.name !== undefined && p.name !== null) ? { name: p.name } : undefined,
                                        seatingType: p.seatingType,
                                        additionalProperty: p.additionalProperty
                                    };
                                })
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
                        { 'screeningRoomSection.branchCode': screeningRoomSection.branchCode }
                    ]
                }
            )
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound(chevre.factory.placeType.ScreeningRoomSection);
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
screeningRoomSectionRouter.delete<ParamsDictionary>(
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
        body('containedInPlace.branchCode')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
            .isString(),
        body('containedInPlace.containedInPlace.branchCode')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
            .isString()
    ],
    validator,
    async (req, res, next) => {
        try {
            const screeningRoomSection: chevre.factory.place.screeningRoomSection.IPlace
                = { ...req.body, branchCode: req.params.branchCode };

            const screeningRoom = <chevre.factory.place.screeningRoom.IPlace>screeningRoomSection.containedInPlace;
            const movieTheater = <chevre.factory.place.movieTheater.IPlace>screeningRoom.containedInPlace;

            const placeRepo = new chevre.repository.Place(mongoose.connection);

            const doc = await placeRepo.placeModel.findOneAndUpdate(
                {
                    'project.id': {
                        $exists: true,
                        $eq: screeningRoomSection.project.id
                    },
                    branchCode: movieTheater.branchCode,
                    'containsPlace.branchCode': screeningRoom.branchCode,
                    'containsPlace.containsPlace.branchCode': screeningRoomSection.branchCode
                },
                {
                    $pull: {
                        'containsPlace.$[screeningRoom].containsPlace': {
                            branchCode: screeningRoomSection.branchCode
                        }
                    }
                },
                <any>{
                    new: true,
                    arrayFilters: [
                        { 'screeningRoom.branchCode': screeningRoom.branchCode }
                    ]
                }
            )
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound(chevre.factory.placeType.ScreeningRoomSection);
            }

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default screeningRoomSectionRouter;
