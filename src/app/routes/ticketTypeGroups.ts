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
    async (_, res, next) => {
        try {
            const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
            const ticketTypeGroups = await ticketTypeRepo.searchTicketTypeGroups({});
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
