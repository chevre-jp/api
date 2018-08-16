/**
 * 場所ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
const placesRouter = Router();

import authentication from '../middlewares/authentication';
// import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

placesRouter.use(authentication);

/**
 * 劇場検索
 */
placesRouter.get(
    '/movieTheater',
    // permitScopes(['aws.cognito.signin.user.admin', 'places', 'places.read-only']),
    validator,
    async (__, res, next) => {
        try {
            const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
            await placeRepo.searchMovieTheaters({}).then((places) => {
                res.json(places);
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 劇場詳細検索
 */
placesRouter.get(
    '/movieTheater/:branchCode',
    // permitScopes(['aws.cognito.signin.user.admin', 'places', 'places.read-only']),
    validator,
    async (req, res, next) => {
        try {
            const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
            const movieTheater = await placeRepo.findMovieTheaterByBranchCode(req.params.branchCode);
            res.json(movieTheater);
        } catch (error) {
            next(error);
        }
    }
);

export default placesRouter;
