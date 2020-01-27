/**
 * 券種グループルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body } from 'express-validator/check';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const ticketTypeGroupsRouter = Router();

ticketTypeGroupsRouter.use(authentication);

ticketTypeGroupsRouter.post(
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

            const ticketTypeGroup = await offerRepo.saveTicketTypeGroup({ ...req.body, id: '', project: project });

            res.status(CREATED)
                .json(ticketTypeGroup);
        } catch (error) {
            next(error);
        }
    }
);

ticketTypeGroupsRouter.get(
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

            const ticketTypeGroups = await offerRepo.searchTicketTypeGroups(searchCoinditions);

            res.json(ticketTypeGroups);
        } catch (error) {
            next(error);
        }
    }
);

ticketTypeGroupsRouter.get(
    '/:id',
    permitScopes(['admin', 'ticketTypeGroups', 'ticketTypeGroups.read-only']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const ticketTypeGroup = await offerRepo.findTicketTypeGroupById({ id: req.params.id });
            res.json(ticketTypeGroup);
        } catch (error) {
            next(error);
        }
    }
);

ticketTypeGroupsRouter.put(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const ticketTypeGroup: chevre.factory.ticketType.ITicketTypeGroup = req.body;
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            await offerRepo.saveTicketTypeGroup(ticketTypeGroup);
            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

ticketTypeGroupsRouter.delete(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            await offerRepo.deleteTicketTypeGroup({ id: req.params.id });
            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default ticketTypeGroupsRouter;
