/**
 * 劇場ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const movieTheaterRouter = Router();
movieTheaterRouter.use(authentication);
movieTheaterRouter.get(
    '',
    permitScopes(['admin', 'places', 'places.read-only']),
    validator,
    async (req, res, next) => {
        try {
            const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
            const searchCoinditions: chevre.factory.place.movieTheater.ISearchConditions = {
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
                sort: req.query.sort,
                name: req.query.name
            };
            const totalCount = await placeRepo.countMovieTheaters(searchCoinditions);
            const movieTheaters = await placeRepo.searchMovieTheaters(searchCoinditions);
            res.set('X-Total-Count', totalCount.toString());
            res.json(movieTheaters);
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
            const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
            const movieTheater = await placeRepo.findMovieTheaterByBranchCode({ branchCode: req.params.branchCode });
            res.json(movieTheater);
        } catch (error) {
            next(error);
        }
    }
);
export default movieTheaterRouter;
