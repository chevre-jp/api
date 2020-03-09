/**
 * オファールーター
 */
import * as chevre from '@chevre/domain';
import { RequestHandler, Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body, query } from 'express-validator/check';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

/**
 * オファーに対するバリデーション
 */
const validations: RequestHandler[] = [
    body('project')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    body('project.id')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
        .isString(),
    body('validFrom')
        .optional()
        .isISO8601()
        .toDate(),
    body('validThrough')
        .optional()
        .isISO8601()
        .toDate()
];

const ticketTypesRouter = Router();
ticketTypesRouter.use(authentication);

ticketTypesRouter.post(
    '',
    permitScopes(['admin']),
    ...[
    ],
    ...validations,
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
            .toInt(),
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
            const searchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const offers = await offerRepo.searchTicketTypes(searchConditions);

            res.json(offers);
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
    ...validations,
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
