/**
 * オファールーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { body, query } from 'express-validator';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const offersRouter = Router();

offersRouter.post(
    '',
    permitScopes(['offers.*']),
    ...[
        body('project')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('project.id')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
            .isString()
    ],
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);

            const project: chevre.factory.project.IProject = { id: req.body.project.id, typeOf: chevre.factory.organizationType.Project };

            const offer = await offerRepo.save({ ...req.body, id: '', project: project });
            res.status(CREATED)
                .json(offer);
        } catch (error) {
            next(error);
        }
    }
);

offersRouter.get(
    '',
    permitScopes(['offers.*']),
    ...[
        query('priceSpecification.price.$gte')
            .optional()
            .isInt()
            .toInt(),
        query('priceSpecification.price.$lte')
            .optional()
            .isInt()
            .toInt(),
        query('priceSpecification.accounting.accountsReceivable.$gte')
            .optional()
            .isInt()
            .toInt(),
        query('priceSpecification.accounting.accountsReceivable.$lte')
            .optional()
            .isInt()
            .toInt(),
        query('priceSpecification.referenceQuantity.value.$eq')
            .optional()
            .isInt()
            .toInt()
    ],
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const searchConditions: chevre.factory.offer.ISearchConditions = {
                ...req.query,
                project: { id: { $eq: req.project.id } },
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const offers = await offerRepo.search(searchConditions);

            res.json(offers);
        } catch (error) {
            next(error);
        }
    }
);

offersRouter.get(
    '/:id',
    permitScopes(['offers.*']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const offer = await offerRepo.findById({ id: req.params.id });

            res.json(offer);
        } catch (error) {
            next(error);
        }
    }
);

offersRouter.put(
    '/:id',
    permitScopes(['offers.*']),
    ...[
        body('project')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('project.id')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
            .isString()
    ],
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            await offerRepo.save(req.body);

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

offersRouter.delete(
    '/:id',
    permitScopes(['offers.*']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            await offerRepo.deleteById({ id: req.params.id });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default offersRouter;
