/**
 * 価格仕様ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

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
            const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
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

priceSpecificationsRouter.post(
    '',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            let priceSpecification: chevre.factory.priceSpecification.IPriceSpecification<any> = {
                ...req.body
            };
            const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
            const doc = await priceSpecificationRepo.priceSpecificationModel.create(priceSpecification);

            priceSpecification = doc.toObject();

            res.status(CREATED)
                .json(priceSpecification);
        } catch (error) {
            next(error);
        }
    }
);

priceSpecificationsRouter.get(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
            const doc = await priceSpecificationRepo.priceSpecificationModel.findById(req.params.id)
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound('PriceSpecification');
            }

            const priceSpecification = doc.toObject();

            res.json(priceSpecification);
        } catch (error) {
            next(error);
        }
    }
);

priceSpecificationsRouter.put(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const priceSpecification: chevre.factory.priceSpecification.IPriceSpecification<any> = {
                ...req.body
            };
            const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
            await priceSpecificationRepo.priceSpecificationModel.findByIdAndUpdate(
                req.params.id,
                priceSpecification
            )
                .exec();

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

priceSpecificationsRouter.get(
    '',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
            const searchCoinditions: chevre.factory.priceSpecification.ISearchConditions<any> = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const totalCount = await priceSpecificationRepo.priceSpecificationModel.countDocuments({})
                .setOptions({ maxTimeMS: 10000 })
                .exec();

            const query = priceSpecificationRepo.priceSpecificationModel.find(
                {},
                {
                    __v: 0,
                    createdAt: 0,
                    updatedAt: 0
                }
            );
            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore else */
            if (searchCoinditions.limit !== undefined && searchCoinditions.page !== undefined) {
                query.limit(searchCoinditions.limit)
                    .skip(searchCoinditions.limit * (searchCoinditions.page - 1));
            }
            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore else */
            if (searchCoinditions.sort !== undefined) {
                query.sort(searchCoinditions.sort);
            }

            const priceSpecifications = await query.setOptions({ maxTimeMS: 10000 })
                .exec()
                .then((docs) => docs.map((doc) => doc.toObject()));

            res.set('X-Total-Count', totalCount.toString())
                .json(priceSpecifications);
        } catch (error) {
            next(error);
        }
    }
);

export default priceSpecificationsRouter;
