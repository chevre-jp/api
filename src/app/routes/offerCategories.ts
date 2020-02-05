/**
 * オファーカテゴリルーター
 */
// import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
// import { query } from 'express-validator/check';
// import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const ticketTypeCategories: any[] = JSON.parse(<string>process.env.OFFER_CATEGORIES);

const offerCategoriesRouter = Router();
offerCategoriesRouter.use(authentication);

/**
 * オファーカテゴリ検索
 */
offerCategoriesRouter.get(
    '',
    permitScopes(['admin']),
    ...[],
    validator,
    async (req, res, next) => {
        try {
            const projectIds: string[] | undefined = (req.query.project !== undefined && Array.isArray(req.query.project.ids))
                ? req.query.project.ids
                : undefined;

            let categories = ticketTypeCategories;
            if (Array.isArray(projectIds)) {
                categories = ticketTypeCategories.filter((c) => c.project !== undefined && projectIds.indexOf(c.project.id) >= 0);
            }

            res.json(categories);
        } catch (error) {
            next(error);
        }
    }
);

export default offerCategoriesRouter;
