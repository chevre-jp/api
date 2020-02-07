/**
 * 座席ルーター
 */
import * as chevre from '@chevre/domain';
// import * as createDebug from 'debug';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
// import { body } from 'express-validator/check';
// import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

// const debug = createDebug('chevre-api:router');

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

export default seatRouter;
