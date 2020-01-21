/**
 * オファールーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body, query } from 'express-validator/check';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const ticketTypesRouter = Router();
ticketTypesRouter.use(authentication);

ticketTypesRouter.post(
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
            const offerRepo = new chevre.repository.Offer(mongoose.connection);

            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: 'Project' };

            const ticketType = await offerRepo.saveTicketType({ ...req.body, id: '', project: project });
            res.status(CREATED)
                .json(ticketType);
        } catch (error) {
            next(error);
        }
    }
);

ticketTypesRouter.get(
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

            const totalCount = await offerRepo.countTicketTypes(searchCoinditions);
            const offers = await offerRepo.searchTicketTypes(searchCoinditions);

            res.set('X-Total-Count', totalCount.toString())
                .json(offers);
        } catch (error) {
            next(error);
        }
    }
);

ticketTypesRouter.get(
    '/:id',
    permitScopes(['admin', 'ticketTypes', 'ticketTypes.read-only']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const ticketType = await offerRepo.findTicketTypeById({ id: req.params.id });

            res.json(ticketType);
        } catch (error) {
            next(error);
        }
    }
);

ticketTypesRouter.put(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            await offerRepo.saveTicketType(req.body);

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

ticketTypesRouter.delete(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            await offerRepo.deleteTicketType({ id: req.params.id });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default ticketTypesRouter;
