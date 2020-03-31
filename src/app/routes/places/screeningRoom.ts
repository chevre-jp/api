/**
 * スクリーンルーター
 */
import * as chevre from '@chevre/domain';
import * as createDebug from 'debug';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body } from 'express-validator/check';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const debug = createDebug('chevre-api:router');

const screeningRoomRouter = Router();
screeningRoomRouter.use(authentication);

/**
 * 作成
 */
screeningRoomRouter.post(
    '',
    permitScopes(['admin']),
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
        body('additionalProperty')
            .optional()
            .isArray(),
        body('openSeatingAllowed')
            .optional()
            .isBoolean()
            .toBoolean()
    ],
    validator,
    async (req, res, next) => {
        try {
            const screeningRoom: chevre.factory.place.screeningRoom.IPlace = { ...req.body };

            const placeRepo = new chevre.repository.Place(mongoose.connection);

            // 劇場の存在確認
            let doc = await placeRepo.placeModel.findOne(
                {
                    'project.id': {
                        $exists: true,
                        $eq: screeningRoom.project.id
                    },
                    branchCode: (<chevre.factory.place.movieTheater.IPlace>screeningRoom.containedInPlace).branchCode
                }
            )
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound('containedInPlace');
            }

            doc = await placeRepo.placeModel.findOneAndUpdate(
                {
                    'project.id': {
                        $exists: true,
                        $eq: screeningRoom.project.id
                    },
                    branchCode: (<chevre.factory.place.movieTheater.IPlace>screeningRoom.containedInPlace).branchCode,
                    'containsPlace.branchCode': { $ne: screeningRoom.branchCode }
                },
                {
                    $push: {
                        containsPlace: screeningRoom
                    }
                },
                { new: true }
            )
                .exec();
            // 存在しなければコード重複
            if (doc === null) {
                throw new chevre.factory.errors.AlreadyInUse(chevre.factory.placeType.ScreeningRoom, ['branchCode']);
            }

            res.status(CREATED)
                .json(screeningRoom);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 検索
 */
screeningRoomRouter.get(
    '',
    permitScopes(['admin']),
    validator,
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res, next) => {
        try {
            const placeRepo = new chevre.repository.Place(mongoose.connection);
            const searchConditions: any = {
                ...req.query,
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

            // 劇場ID
            const containedInPlaceIdEq = searchConditions.containedInPlace?.id?.$eq;
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

            const branchCodeRegex = searchConditions.branchCode?.$regex;
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

            const nameCodeRegex = searchConditions.name?.$regex;
            if (typeof nameCodeRegex === 'string') {
                matchStages.push({
                    $match: {
                        $or: [
                            {
                                'containsPlace.name.ja': {
                                    $exists: true,
                                    $regex: new RegExp(nameCodeRegex)
                                }
                            }
                        ]
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

            const screeningRooms = await aggregate.exec();

            res.json(screeningRooms);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 更新
 */
screeningRoomRouter.put(
    '/:branchCode',
    permitScopes(['admin']),
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
        body('additionalProperty')
            .optional()
            .isArray(),
        body('openSeatingAllowed')
            .optional()
            .isBoolean()
            .toBoolean()
    ],
    validator,
    async (req, res, next) => {
        try {
            const screeningRoom: chevre.factory.place.screeningRoom.IPlace = { ...req.body, branchCode: req.params.branchCode };
            const $unset = req.body.$unset;

            const placeRepo = new chevre.repository.Place(mongoose.connection);

            debug('updating screeningRoom', screeningRoom);
            debug(typeof screeningRoom.openSeatingAllowed);
            const doc = await placeRepo.placeModel.findOneAndUpdate(
                {
                    'project.id': {
                        $exists: true,
                        $eq: screeningRoom.project.id
                    },
                    branchCode: (<chevre.factory.place.movieTheater.IPlace>screeningRoom.containedInPlace).branchCode,
                    'containsPlace.branchCode': screeningRoom.branchCode
                },
                // 限られた属性のみ更新する
                {
                    'containsPlace.$[screeningRoom].name': screeningRoom.name,
                    ...(screeningRoom.address !== undefined && screeningRoom.address !== null)
                        ? { 'containsPlace.$[screeningRoom].address': screeningRoom.address }
                        : undefined,
                    ...(typeof screeningRoom.openSeatingAllowed === 'boolean')
                        ? { 'containsPlace.$[screeningRoom].openSeatingAllowed': screeningRoom.openSeatingAllowed }
                        : undefined,
                    ...(Array.isArray(screeningRoom.additionalProperty))
                        ? { 'containsPlace.$[screeningRoom].additionalProperty': screeningRoom.additionalProperty }
                        : undefined,
                    ...($unset !== undefined && $unset !== null)
                        ? { $unset: req.body.$unset }
                        : undefined
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
                throw new chevre.factory.errors.NotFound(chevre.factory.placeType.ScreeningRoom);
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
screeningRoomRouter.delete(
    '/:branchCode',
    permitScopes(['admin']),
    ...[
        body('project')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('containedInPlace.branchCode')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
            .isString()
    ],
    validator,
    async (req, res, next) => {
        try {
            const screeningRoom: chevre.factory.place.screeningRoom.IPlace = { ...req.body, branchCode: req.params.branchCode };

            const placeRepo = new chevre.repository.Place(mongoose.connection);

            const doc = await placeRepo.placeModel.findOneAndUpdate(
                {
                    'project.id': {
                        $exists: true,
                        $eq: screeningRoom.project.id
                    },
                    branchCode: (<chevre.factory.place.movieTheater.IPlace>screeningRoom.containedInPlace).branchCode,
                    'containsPlace.branchCode': screeningRoom.branchCode
                },
                {
                    $pull: {
                        containsPlace: { branchCode: screeningRoom.branchCode }
                    }
                }
            )
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound(chevre.factory.placeType.ScreeningRoom);
            }

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default screeningRoomRouter;
