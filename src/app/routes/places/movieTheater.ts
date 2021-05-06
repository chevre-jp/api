/**
 * 劇場ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body } from 'express-validator';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const movieTheaterRouter = Router();

movieTheaterRouter.post(
    '',
    permitScopes([]),
    ...[
        body('project')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('branchCode')
            .not()
            .isEmpty(),
        body('name')
            .not()
            .isEmpty()
    ],
    validator,
    async (req, res, next) => {
        try {
            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: chevre.factory.organizationType.Project };

            let movieTheater: chevre.factory.place.movieTheater.IPlace = {
                ...req.body,
                typeOf: chevre.factory.placeType.MovieTheater,
                id: '',
                project: project
            };

            const placeRepo = new chevre.repository.Place(mongoose.connection);
            movieTheater = await placeRepo.saveMovieTheater(movieTheater);

            res.status(CREATED)
                .json(movieTheater);
        } catch (error) {
            next(error);
        }
    }
);

movieTheaterRouter.get(
    '',
    permitScopes(['places', 'places.read-only']),
    validator,
    async (req, res, next) => {
        try {
            const placeRepo = new chevre.repository.Place(mongoose.connection);
            const searchConditions: chevre.factory.place.movieTheater.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const movieTheaters = await placeRepo.searchMovieTheaters(searchConditions);

            res.json(movieTheaters);
        } catch (error) {
            next(error);
        }
    }
);

movieTheaterRouter.get(
    '/:id',
    permitScopes(['places', 'places.read-only']),
    validator,
    async (req, res, next) => {
        try {
            const placeRepo = new chevre.repository.Place(mongoose.connection);
            const movieTheater = await placeRepo.findById({ id: req.params.id });

            res.json(movieTheater);
        } catch (error) {
            next(error);
        }
    }
);

// tslint:disable-next-line:use-default-type-parameter
movieTheaterRouter.put<ParamsDictionary>(
    '/:id',
    permitScopes([]),
    ...[
        body('branchCode')
            .not()
            .isEmpty(),
        body('name')
            .not()
            .isEmpty()
    ],
    validator,
    async (req, res, next) => {
        try {
            const movieTheater: chevre.factory.place.movieTheater.IPlace = {
                ...req.body,
                typeOf: chevre.factory.placeType.MovieTheater,
                id: req.params.id
            };
            const placeRepo = new chevre.repository.Place(mongoose.connection);
            await placeRepo.saveMovieTheater(movieTheater);

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

movieTheaterRouter.delete(
    '/:id',
    permitScopes([]),
    validator,
    async (req, res, next) => {
        try {
            const placeRepo = new chevre.repository.Place(mongoose.connection);

            await placeRepo.placeModel.findOneAndDelete({
                _id: req.params.id
            })
                .exec()
                .then((doc) => {
                    if (doc === null) {
                        throw new chevre.factory.errors.NotFound(placeRepo.placeModel.modelName);
                    }
                });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default movieTheaterRouter;
