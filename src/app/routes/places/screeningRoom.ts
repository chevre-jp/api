/**
 * スクリーンルーター
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

const screeningRoomRouter = Router();
screeningRoomRouter.use(authentication);

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
                    branchCode: (<chevre.factory.place.movieTheater.IPlace>screeningRoom.containedInPlace).branchCode,
                    'containsPlace.branchCode': screeningRoom.branchCode
                },
                // 限られた属性のみ更新する
                {
                    'containsPlace.$.name': screeningRoom.name,
                    ...(screeningRoom.address !== undefined && screeningRoom.address !== null)
                        ? { 'containsPlace.$.address': screeningRoom.address }
                        : undefined,
                    ...(typeof screeningRoom.openSeatingAllowed === 'boolean')
                        ? { 'containsPlace.$.openSeatingAllowed': screeningRoom.openSeatingAllowed }
                        : undefined,
                    ...(Array.isArray(screeningRoom.additionalProperty))
                        ? { 'containsPlace.$.additionalProperty': screeningRoom.additionalProperty }
                        : undefined,
                    ...($unset !== undefined && $unset !== null)
                        ? { $unset: req.body.$unset }
                        : undefined
                },
                { new: true }
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