/**
 * 券種グループルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { CREATED, NO_CONTENT } from 'http-status';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const ticketTypeGroupsRouter = Router();
ticketTypeGroupsRouter.use(authentication);
ticketTypeGroupsRouter.post(
    '',
    permitScopes(['admin']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const ticketTypeGroup: chevre.factory.ticketType.ITicketTypeGroup = {
                id: req.body.id,
                name: req.body.name,
                ticketTypes: req.body.ticketTypes
            };
            const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
            await ticketTypeRepo.createTicketTypeGroup(ticketTypeGroup);
            res.status(CREATED).json(ticketTypeGroup);
        } catch (error) {
            next(error);
        }
    }
);
ticketTypeGroupsRouter.get(
    '',
    permitScopes(['admin', 'ticketTypeGroups', 'ticketTypeGroups.read-only']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
            const searchCoinditions = {
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : /* istanbul ignore next*/ 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : /* istanbul ignore next*/ 1,
                id: req.query.id,
                name: req.query.name
            };
            const totalCount = await ticketTypeRepo.countTicketTypeGroups(searchCoinditions);
            const ticketTypeGroups = await ticketTypeRepo.searchTicketTypeGroups(searchCoinditions);
            res.set('Total-Count', totalCount.toString());
            res.json(ticketTypeGroups);
        } catch (error) {
            next(error);
        }
    }
);
ticketTypeGroupsRouter.get(
    '/:id',
    permitScopes(['admin', 'ticketTypeGroups', 'ticketTypeGroups.read-only']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
            const ticketTypeGroup = await ticketTypeRepo.findTicketTypeGroupById({ id: req.params.id });
            res.json(ticketTypeGroup);
        } catch (error) {
            next(error);
        }
    }
);
ticketTypeGroupsRouter.put(
    '/:id',
    permitScopes(['admin']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const ticketTypeGroup: chevre.factory.ticketType.ITicketTypeGroup = {
                id: req.body.id,
                name: req.body.name,
                ticketTypes: req.body.ticketTypes
            };
            const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
            await ticketTypeRepo.updateTicketTypeGroup(ticketTypeGroup);
            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);
ticketTypeGroupsRouter.delete(
    '/:id',
    permitScopes(['admin']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
            await ticketTypeRepo.deleteTicketTypeGroup({ id: req.params.id });
            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);
export default ticketTypeGroupsRouter;
