/**
 * 勘定科目ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { CREATED, NO_CONTENT } from 'http-status';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const accountTitlesRouter = Router();
accountTitlesRouter.use(authentication);

accountTitlesRouter.post(
    '',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const accountTitle: chevre.factory.accountTitle.IAccountTitle = req.body;
            const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
            await accountTitleRepo.save(accountTitle);
            res.status(CREATED).json(accountTitle);
        } catch (error) {
            next(error);
        }
    }
);

accountTitlesRouter.get(
    '',
    permitScopes(['admin', 'accountTitles', 'accountTitles.read-only']),
    validator,
    async (req, res, next) => {
        try {
            const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
            const searchCoinditions: chevre.factory.accountTitle.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };
            const totalCount = await accountTitleRepo.count(searchCoinditions);
            const acconutTitles = await accountTitleRepo.search(searchCoinditions);
            res.set('X-Total-Count', totalCount.toString());
            res.json(acconutTitles);
        } catch (error) {
            next(error);
        }
    }
);

accountTitlesRouter.get(
    '/:identifier',
    permitScopes(['admin', 'accountTitles', 'accountTitles.read-only']),
    validator,
    async (req, res, next) => {
        try {
            const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
            const accountTitle = await accountTitleRepo.findMovieByIdentifier({ identifier: req.params.identifier });
            res.json(accountTitle);
        } catch (error) {
            next(error);
        }
    }
);

accountTitlesRouter.put(
    '/:identifier',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const accountTitle: chevre.factory.accountTitle.IAccountTitle = req.body;
            const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
            await accountTitleRepo.save(accountTitle);
            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);

accountTitlesRouter.delete(
    '/:identifier',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
            await accountTitleRepo.deleteByIdentifier({ identifier: req.params.identifier });
            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);

export default accountTitlesRouter;
