/**
 * 券種ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { CREATED, NO_CONTENT } from 'http-status';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const ticketTypesRouter = Router();
ticketTypesRouter.use(authentication);
ticketTypesRouter.post(
    '',
    permitScopes(['admin']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
            const ticketType = await ticketTypeRepo.createTicketType(req.body);
            res.status(CREATED).json(ticketType);
        } catch (error) {
            next(error);
        }
    }
);
ticketTypesRouter.get(
    '',
    permitScopes(['admin', 'ticketTypes', 'ticketTypes.read-only']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
            const searchCoinditions = {
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
                id: req.query.id,
                name: req.query.name
            };
            const totalCount = await ticketTypeRepo.countTicketTypes(searchCoinditions);
            const ticketTypes = await ticketTypeRepo.searchTicketTypes(searchCoinditions);
            res.set('X-Total-Count', totalCount.toString());
            res.json(ticketTypes);
        } catch (error) {
            next(error);
        }
    }
);
ticketTypesRouter.get(
    '/:id',
    permitScopes(['admin', 'ticketTypes', 'ticketTypes.read-only']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
            const ticketType = await ticketTypeRepo.findTicketTypeById({ id: req.params.id });
            res.json(ticketType);
        } catch (error) {
            next(error);
        }
    }
);
ticketTypesRouter.put(
    '/:id',
    permitScopes(['admin']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
            await ticketTypeRepo.updateTicketType(req.body);
            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);
ticketTypesRouter.delete(
    '/:id',
    permitScopes(['admin']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
            await ticketTypeRepo.deleteTicketType({ id: req.params.id });
            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);
export default ticketTypesRouter;
