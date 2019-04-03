/**
 * オファールーター
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

const offersRouter = Router();
offersRouter.use(authentication);

offersRouter.post(
    '',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const ticketType = await offerRepo.createOffer(req.body);
            res.status(CREATED)
                .json(ticketType);
        } catch (error) {
            next(error);
        }
    }
);

offersRouter.get(
    '',
    permitScopes(['admin', 'ticketTypes', 'ticketTypes.read-only']),
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

            const totalCount = await offerRepo.countOffers(searchCoinditions);
            const offers = await offerRepo.searchOffers(searchCoinditions);

            res.set('X-Total-Count', totalCount.toString())
                .json(offers);
        } catch (error) {
            next(error);
        }
    }
);

offersRouter.get(
    '/:id',
    permitScopes(['admin', 'ticketTypes', 'ticketTypes.read-only']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const ticketType = await offerRepo.findOfferById({ id: req.params.id });

            res.json(ticketType);
        } catch (error) {
            next(error);
        }
    }
);

offersRouter.put(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            await offerRepo.updateOffer(req.body);

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

offersRouter.delete(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            await offerRepo.deleteOffer({ id: req.params.id });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default offersRouter;
