/**
 * 券種グループルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const offerCatalogsRouter = Router();

offerCatalogsRouter.use(authentication);

offerCatalogsRouter.post(
    '',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const ticketTypeGroup: chevre.factory.ticketType.ITicketTypeGroup = req.body;
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            await offerRepo.createOfferCatalog(ticketTypeGroup);
            res.status(CREATED)
                .json(ticketTypeGroup);
        } catch (error) {
            next(error);
        }
    }
);

offerCatalogsRouter.get(
    '',
    permitScopes(['admin', 'ticketTypeGroups', 'ticketTypeGroups.read-only']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const searchCoinditions: chevre.factory.ticketType.ITicketTypeGroupSearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };
            const totalCount = await offerRepo.countTicketTypeGroups(searchCoinditions);
            const ticketTypeGroups = await offerRepo.searchOfferCatalogs(searchCoinditions);
            res.set('X-Total-Count', totalCount.toString());
            res.json(ticketTypeGroups);
        } catch (error) {
            next(error);
        }
    }
);

offerCatalogsRouter.get(
    '/:id',
    permitScopes(['admin', 'ticketTypeGroups', 'ticketTypeGroups.read-only']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const ticketTypeGroup = await offerRepo.findOfferCatalogById({ id: req.params.id });
            res.json(ticketTypeGroup);
        } catch (error) {
            next(error);
        }
    }
);

offerCatalogsRouter.put(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const ticketTypeGroup: chevre.factory.ticketType.ITicketTypeGroup = req.body;
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            await offerRepo.updateOfferCatalog(ticketTypeGroup);
            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

offerCatalogsRouter.delete(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            await offerRepo.deleteOfferCatalog({ id: req.params.id });
            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default offerCatalogsRouter;
