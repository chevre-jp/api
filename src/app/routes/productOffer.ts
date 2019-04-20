/**
 * プロダクトオファールーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { query } from 'express-validator/check';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const productOffersRouter = Router();
productOffersRouter.use(authentication);

productOffersRouter.post(
    '',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);

            const project: chevre.factory.project.IProject = (req.body.project !== undefined)
                ? { ...req.body.project, typeOf: 'Project' }
                : { id: <string>process.env.PROJECT_ID, typeOf: 'Project' };

            const ticketType = await offerRepo.saveProductOffer({ ...req.body, id: '', project: project });

            res.status(CREATED)
                .json(ticketType);
        } catch (error) {
            next(error);
        }
    }
);

productOffersRouter.get(
    '',
    permitScopes(['admin']),
    ...[
        query('priceSpecification.minPrice')
            .optional()
            .isInt()
            .toInt(),
        query('priceSpecification.maxPrice')
            .optional()
            .isInt()
            .toInt(),
        query('priceSpecification.accounting.minAccountsReceivable')
            .optional()
            .isInt()
            .toInt(),
        query('priceSpecification.accounting.maxAccountsReceivable')
            .optional()
            .isInt()
            .toInt(),
        query('priceSpecification.referenceQuantity.value')
            .optional()
            .isInt()
            .toInt()
    ],
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const searchCoinditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const totalCount = await offerRepo.countProductOffers(searchCoinditions);
            const offers = await offerRepo.searchProductOffers(searchCoinditions);

            res.set('X-Total-Count', totalCount.toString())
                .json(offers);
        } catch (error) {
            next(error);
        }
    }
);

productOffersRouter.put(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            await offerRepo.saveProductOffer(req.body);

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

productOffersRouter.delete(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            await offerRepo.deleteProductOffer({ id: req.params.id });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default productOffersRouter;
