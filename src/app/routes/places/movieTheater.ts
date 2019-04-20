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
            const project: chevre.factory.project.IProject = (req.body.project !== undefined)
                ? { ...req.body.project, typeOf: 'Project' }
                : { id: <string>process.env.PROJECT_ID, typeOf: 'Project' };

            const movieTheater: chevre.factory.place.movieTheater.IPlace = {
                ...req.body,
                typeOf: chevre.factory.placeType.MovieTheater,
                project: project
            };

            const placeRepo = new chevre.repository.Place(mongoose.connection);
            await placeRepo.saveMovieTheater(movieTheater);

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
            const totalCount = await placeRepo.countMovieTheaters(searchCoinditions);
            const movieTheaters = await placeRepo.searchMovieTheaters(searchCoinditions);

            res.set('X-Total-Count', totalCount.toString())
                .json(movieTheaters);
        } catch (error) {
            next(error);
        }
    }
);

movieTheaterRouter.get(
    '/:branchCode',
    permitScopes(['admin', 'places', 'places.read-only']),
    validator,
    async (req, res, next) => {
        try {
            const placeRepo = new chevre.repository.Place(mongoose.connection);
            const movieTheater = await placeRepo.findMovieTheaterByBranchCode({ branchCode: req.params.branchCode });

            res.json(movieTheater);
        } catch (error) {
            next(error);
        }
    }
);

movieTheaterRouter.put(
    '/:branchCode',
    permitScopes(['admin']),
    ...[
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
                branchCode: req.params.branchCode
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
