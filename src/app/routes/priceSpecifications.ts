/**
 * 価格仕様ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const priceSpecificationsRouter = Router();
priceSpecificationsRouter.use(authentication);
priceSpecificationsRouter.get(
    '/compoundPriceSpecification',
    permitScopes(['admin']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const priceSpecificationRepo = new chevre.repository.PriceSpecification(chevre.mongoose.connection);
            const searchCoinditions: chevre.factory.compoundPriceSpecification.ISearchConditions<chevre.factory.priceSpecificationType> = {
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
                sort: req.query.sort,
                typeOf: chevre.factory.priceSpecificationType.CompoundPriceSpecification,
                priceComponent: req.query.priceComponent
            };
            const totalCount = await priceSpecificationRepo.countCompoundPriceSpecifications(searchCoinditions);
            const priceSpecifications = await priceSpecificationRepo.searchCompoundPriceSpecifications(searchCoinditions);
            res.set('X-Total-Count', totalCount.toString());
            res.json(priceSpecifications);
        } catch (error) {
            next(error);
        }
    }
);
export default priceSpecificationsRouter;
