/**
 * 座席ルーター
 */
import * as chevre from '@chevre/domain';
import * as createDebug from 'debug';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body } from 'express-validator/check';
import { NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const debug = createDebug('chevre-api:router');

const seatRouter = Router();
seatRouter.use(authentication);

/**
 * 座席検索
 */
seatRouter.get(
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

            if (searchConditions.containedInPlace !== undefined) {
                if (searchConditions.containedInPlace.containedInPlace !== undefined) {
                    if (searchConditions.containedInPlace.containedInPlace.branchCode !== undefined) {
                        if (typeof searchConditions.containedInPlace.containedInPlace.branchCode.$eq === 'string') {
                            matchStages.push({
                                $match: {
                                    'containsPlace.branchCode': {
                                        $exists: true,
                                        $eq: searchConditions.containedInPlace.containedInPlace.branchCode.$eq
                                    }
                                }
                            });
                        }
                    }

                    if (searchConditions.containedInPlace.containedInPlace.containedInPlace !== undefined) {
                        if (searchConditions.containedInPlace.containedInPlace.containedInPlace.branchCode !== undefined) {
                            if (typeof searchConditions.containedInPlace.containedInPlace.containedInPlace.branchCode.$eq === 'string') {
                                matchStages.push({
                                    $match: {
                                        branchCode: {
                                            $exists: true,
                                            $eq: searchConditions.containedInPlace.containedInPlace.containedInPlace.branchCode.$eq
                                        }
                                    }
                                });
                            }
                        }
                    }
                }
            }

            // 座席コード
            if (searchConditions.branchCode !== undefined) {
                if (typeof searchConditions.branchCode.$eq === 'string') {
                    matchStages.push({
                        $match: {
                            'containsPlace.containsPlace.containsPlace.branchCode': {
                                $exists: true,
                                $eq: searchConditions.branchCode.$eq
                            }
                        }
                    });
                }
            }

            const aggregate = placeRepo.placeModel.aggregate([
                { $unwind: '$containsPlace' },
                { $unwind: '$containsPlace.containsPlace' },
                { $unwind: '$containsPlace.containsPlace.containsPlace' },
                ...matchStages,
                {
                    $project: {
                        _id: 0,
                        typeOf: '$containsPlace.containsPlace.containsPlace.typeOf',
                        branchCode: '$containsPlace.containsPlace.containsPlace.branchCode',
                        seatingType: '$containsPlace.containsPlace.containsPlace.seatingType',
                        containedInPlace: {
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
                            }
                        }
                        // additionalProperty: '$hasCategoryCode.hasCategoryCode.additionalProperty'
                    }
                }
            ]);

            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore else */
            if (searchConditions.limit !== undefined && searchConditions.page !== undefined) {
                aggregate.limit(searchConditions.limit * searchConditions.page)
                    .skip(searchConditions.limit * (searchConditions.page - 1));
            }

            const seats = await aggregate.exec();

            res.json(seats);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 更新
 */
seatRouter.put(
    '/:branchCode',
    permitScopes(['admin']),
    ...[
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
            .isString()
    ],
    validator,
    async (req, res, next) => {
        try {
            const seat: chevre.factory.place.seat.IPlace = { ...req.body, branchCode: req.params.branchCode };
            const $unset = req.body.$unset;

            debug('updating seat', seat, $unset);
            // const placeRepo = new chevre.repository.Place(mongoose.connection);
            // const screeningRoomSection = <chevre.factory.place.screeningRoomSection.IPlace>seat.containedInPlace;
            // const screeningRoom = <chevre.factory.place.screeningRoom.IPlace>screeningRoomSection.containedInPlace;
            // const movieTheater = <chevre.factory.place.movieTheater.IPlace>screeningRoom.containedInPlace;
            // const doc = await placeRepo.placeModel.findOneAndUpdate(
            //     {
            //         branchCode: movieTheater.branchCode,
            //         'containsPlace.branchCode': screeningRoom.branchCode,
            //         'containsPlace.containsPlace.branchCode': screeningRoomSection.branchCode,
            //         'containsPlace.containsPlace.containsPlace.branchCode': seat.branchCode
            //     },
            //     // 限られた属性のみ更新する
            //     {
            //         // 'containsPlace.$.name': screeningRoom.name,
            //         ...(Array.isArray(screeningRoom.additionalProperty))
            //             ? { 'containsPlace.$.additionalProperty': screeningRoom.additionalProperty }
            //             : undefined,
            //         ...($unset !== undefined && $unset !== null)
            //             ? { $unset: req.body.$unset }
            //             : undefined
            //     },
            //     { new: true }
            // )
            //     .exec();
            // if (doc === null) {
            //     throw new chevre.factory.errors.NotFound(chevre.factory.placeType.ScreeningRoom);
            // }

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default seatRouter;
