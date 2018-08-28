/**
 * 映画ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { CREATED, NO_CONTENT } from 'http-status';
import * as moment from 'moment';

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const movieRouter = Router();
movieRouter.use(authentication);
movieRouter.post(
    '',
    permitScopes(['admin']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const movie: chevre.factory.creativeWork.movie.ICreativeWork = {
                typeOf: chevre.factory.creativeWorkType.Movie,
                identifier: req.body.identifier,
                name: req.body.name,
                duration: moment.duration(req.body.duration).toISOString(),
                contentRating: req.body.contentRating
            };
            const creativeWorkRepo = new chevre.repository.CreativeWork(chevre.mongoose.connection);
            await creativeWorkRepo.saveMovie(movie);
            res.status(CREATED).json(movie);
        } catch (error) {
            next(error);
        }
    }
);
movieRouter.get(
    '',
    permitScopes(['admin', 'creativeWorks', 'creativeWorks.read-only']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const creativeWorkRepo = new chevre.repository.CreativeWork(chevre.mongoose.connection);
            const searchCoinditions: chevre.factory.creativeWork.movie.ISearchConditions = {
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : /* istanbul ignore next*/ 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : /* istanbul ignore next*/ 1,
                identifier: req.query.identifier,
                name: req.query.name
            };
            const totalCount = await creativeWorkRepo.countMovies(searchCoinditions);
            const movies = await creativeWorkRepo.searchMovies(searchCoinditions);
            res.set('Total-Count', totalCount.toString());
            res.json(movies);
        } catch (error) {
            next(error);
        }
    }
);
movieRouter.get(
    '/:identifier',
    permitScopes(['admin', 'creativeWorks', 'creativeWorks.read-only']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const creativeWorkRepo = new chevre.repository.CreativeWork(chevre.mongoose.connection);
            const movie = await creativeWorkRepo.findMovieByIdentifier({ identifier: req.params.identifier });
            res.json(movie);
        } catch (error) {
            next(error);
        }
    }
);
movieRouter.put(
    '/:identifier',
    permitScopes(['admin']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const movie: chevre.factory.creativeWork.movie.ICreativeWork = {
                typeOf: chevre.factory.creativeWorkType.Movie,
                identifier: req.params.identifier,
                name: req.body.name,
                duration: moment.duration(Number(req.body.duration), 'm').toISOString(),
                contentRating: req.body.contentRating
            };
            const creativeWorkRepo = new chevre.repository.CreativeWork(chevre.mongoose.connection);
            await creativeWorkRepo.saveMovie(movie);
            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);
movieRouter.delete(
    '/:identifier',
    permitScopes(['admin']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const creativeWorkRepo = new chevre.repository.CreativeWork(chevre.mongoose.connection);
            await creativeWorkRepo.deleteMovie({ identifier: req.params.identifier });
            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);
export default movieRouter;
