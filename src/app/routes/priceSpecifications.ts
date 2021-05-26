/**
 * 価格仕様ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { body } from 'express-validator';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const priceSpecificationsRouter = Router();

// priceSpecificationsRouter.get(
//     '/compoundPriceSpecification',
//     permitScopes([]),
//     validator,
//     async (req, res, next) => {
//         try {
//             const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
//             const searchConditions: any = {
//                 // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
//                 limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
//                 page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
//                 sort: req.query.sort,
//                 typeOf: chevre.factory.priceSpecificationType.CompoundPriceSpecification,
//                 priceComponent: req.query.priceComponent
//             };
//             const priceSpecifications = await priceSpecificationRepo.searchCompoundPriceSpecifications(searchConditions);
//             res.json(priceSpecifications);
//         } catch (error) {
//             next(error);
//         }
//     }
// );

priceSpecificationsRouter.post(
    '',
    permitScopes(['priceSpecifications.*']),
    ...[
        body('project')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: chevre.factory.organizationType.Project };

            let priceSpecification: chevre.factory.priceSpecification.IPriceSpecification<any> = {
                ...req.body,
                project: project
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
    permitScopes(['priceSpecifications.*']),
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
    permitScopes(['priceSpecifications.*']),
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

priceSpecificationsRouter.delete(
    '/:id',
    permitScopes(['priceSpecifications.*']),
    validator,
    async (req, res, next) => {
        try {
            const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
            await priceSpecificationRepo.priceSpecificationModel.findOneAndDelete(
                { _id: req.params.id }
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
    permitScopes(['priceSpecifications.*']),
    validator,
    async (req, res, next) => {
        try {
            const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
            const searchConditions: chevre.factory.priceSpecification.ISearchConditions<any> = {
                ...req.query,
                project: { id: { $eq: req.project.id } },
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const priceSpecifications = await priceSpecificationRepo.search(searchConditions);

            res.json(priceSpecifications);
        } catch (error) {
            next(error);
        }
    }
);

export default priceSpecificationsRouter;
