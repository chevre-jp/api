/**
 * オファーカタログルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { body } from 'express-validator';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const offerCatalogsRouter = Router();

offerCatalogsRouter.post(
    '',
    permitScopes(['admin']),
    ...[
        body('project')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);

            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: chevre.factory.organizationType.Project };

            const ticketTypeGroup = await offerCatalogRepo.save({ ...req.body, id: '', project: project });

            res.status(CREATED)
                .json(ticketTypeGroup);
        } catch (error) {
            next(error);
        }
    }
);

offerCatalogsRouter.get(
    '',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
            const searchConditions: chevre.factory.offerCatalog.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const ticketTypeGroups = await offerCatalogRepo.search(searchConditions);
            res.json(ticketTypeGroups);
        } catch (error) {
            next(error);
        }
    }
);

offerCatalogsRouter.get(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
            const ticketTypeGroup = await offerCatalogRepo.findById({ id: req.params.id });
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
            const offerCatalog: chevre.factory.offerCatalog.IOfferCatalog = req.body;
            const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
            await offerCatalogRepo.save(offerCatalog);
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
            const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
            await offerCatalogRepo.deleteById({ id: req.params.id });
            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default offerCatalogsRouter;
