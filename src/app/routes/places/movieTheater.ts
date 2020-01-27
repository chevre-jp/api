/**
 * 劇場ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body } from 'express-validator/check';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const movieTheaterRouter = Router();

movieTheaterRouter.use(authentication);

movieTheaterRouter.post(
    '',
    permitScopes(['admin']),
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
            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: 'Project' };

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
    permitScopes(['admin', 'places', 'places.read-only']),
    validator,
    async (req, res, next) => {
        try {
            const placeRepo = new chevre.repository.Place(mongoose.connection);
            const searchCoinditions: chevre.factory.place.movieTheater.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const movieTheaters = await placeRepo.searchMovieTheaters(searchCoinditions);

            res.json(movieTheaters);
        } catch (error) {
            next(error);
        }
    }
);

movieTheaterRouter.get(
    '/:id',
    permitScopes(['admin', 'places', 'places.read-only']),
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

movieTheaterRouter.put(
    '/:id',
    permitScopes(['admin']),
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

export default movieTheaterRouter;
