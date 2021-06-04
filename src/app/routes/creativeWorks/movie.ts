/**
 * 映画ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, query } from 'express-validator';
import { CREATED, NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const movieRouter = Router();

movieRouter.post(
    '',
    permitScopes(['creativeWorks.*']),
    ...[
        body('project')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('datePublished')
            .optional()
            .isISO8601()
            .toDate(),
        body('datePublished')
            .optional()
            .isISO8601()
            .toDate(),
        body('offers.availabilityStarts')
            .optional()
            .isISO8601()
            .toDate(),
        body('offers.availabilityEnds')
            .optional()
            .isISO8601()
            .toDate(),
        body('offers.validFrom')
            .optional()
            .isISO8601()
            .toDate(),
        body('offers.validThrough')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const creativeWorkRepo = new chevre.repository.CreativeWork(mongoose.connection);

            const project: chevre.factory.project.IProject = { id: req.project.id, typeOf: chevre.factory.organizationType.Project };

            let movie: chevre.factory.creativeWork.movie.ICreativeWork = {
                ...req.body,
                ...(typeof req.body.duration === 'string' && req.body.duration.lenght > 0)
                    ? {
                        duration: moment.duration(req.body.duration)
                            .toISOString()
                    }
                    : undefined,
                id: '',
                project: project
            };

            movie = await creativeWorkRepo.saveMovie(movie);

            res.status(CREATED)
                .json(movie);
        } catch (error) {
            next(error);
        }
    }
);

movieRouter.get(
    '',
    permitScopes(['creativeWorks.*', 'creativeWorks', 'creativeWorks.read']),
    ...[
        query('datePublishedFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('datePublishedThrough')
            .optional()
            .isISO8601()
            .toDate(),
        query('offers.availableFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('offers.availableThrough')
            .optional()
            .isISO8601()
            .toDate(),
        query('offers.validFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('offers.validThrough')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const creativeWorkRepo = new chevre.repository.CreativeWork(mongoose.connection);
            const searchConditions: chevre.factory.creativeWork.movie.ISearchConditions = {
                ...req.query,
                project: { ids: [req.project.id] },
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };
            const movies = await creativeWorkRepo.searchMovies(searchConditions);

            res.json(movies);
        } catch (error) {
            next(error);
        }
    }
);

movieRouter.get(
    '/:id',
    permitScopes(['creativeWorks.*', 'creativeWorks', 'creativeWorks.read']),
    validator,
    async (req, res, next) => {
        try {
            const creativeWorkRepo = new chevre.repository.CreativeWork(mongoose.connection);
            const movie = await creativeWorkRepo.findMovieById({ id: req.params.id });

            res.json(movie);
        } catch (error) {
            next(error);
        }
    }
);

// tslint:disable-next-line:use-default-type-parameter
movieRouter.put<ParamsDictionary>(
    '/:id',
    permitScopes(['creativeWorks.*']),
    ...[
        body('datePublished')
            .optional()
            .isISO8601()
            .toDate(),
        body('datePublished')
            .optional()
            .isISO8601()
            .toDate(),
        body('offers.availabilityStarts')
            .optional()
            .isISO8601()
            .toDate(),
        body('offers.availabilityEnds')
            .optional()
            .isISO8601()
            .toDate(),
        body('offers.validFrom')
            .optional()
            .isISO8601()
            .toDate(),
        body('offers.validThrough')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const creativeWorkRepo = new chevre.repository.CreativeWork(mongoose.connection);

            const movie: chevre.factory.creativeWork.movie.ICreativeWork = {
                ...req.body,
                ...(typeof req.body.duration === 'string' && req.body.duration.lenght > 0)
                    ? {
                        duration: moment.duration(req.body.duration)
                            .toISOString()
                    }
                    : undefined,
                id: req.params.id
            };
            await creativeWorkRepo.saveMovie(movie);

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

movieRouter.delete(
    '/:id',
    permitScopes(['creativeWorks.*']),
    validator,
    async (req, res, next) => {
        try {
            const creativeWorkRepo = new chevre.repository.CreativeWork(mongoose.connection);
            await creativeWorkRepo.deleteMovie({ id: req.params.id });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default movieRouter;
