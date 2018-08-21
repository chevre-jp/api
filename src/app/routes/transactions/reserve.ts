/**
 * 予約取引ルーター
 */
import * as chevre from '@chevre/domain';
import * as createDebug from 'debug';
import { Router } from 'express';
import { NO_CONTENT } from 'http-status';
import * as moment from 'moment';

const reserveTransactionsRouter = Router();

import * as redis from '../../../redis';
import authentication from '../../middlewares/authentication';
// import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const debug = createDebug('chevre-api:*');

reserveTransactionsRouter.use(authentication);

reserveTransactionsRouter.post(
    '/start',
    // permitScopes(['admin']),
    (req, _, next) => {
        req.checkBody('expires', 'invalid expires').notEmpty().withMessage('expires is required').isISO8601();
        req.checkBody('agent', 'invalid agent').notEmpty().withMessage('agent is required');
        req.checkBody('agent.typeOf', 'invalid agent.typeOf').notEmpty().withMessage('agent.typeOf is required');
        req.checkBody('agent.name', 'invalid agent.name').notEmpty().withMessage('agent.name is required');

        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
            const transactionRepo = new chevre.repository.Transaction(chevre.mongoose.connection);
            const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
            const eventAvailabilityRepo = new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient());
            const reservationRepo = new chevre.repository.Reservation(chevre.mongoose.connection);
            const reservationNumberRepo = new chevre.repository.ReservationNumber(redis.getClient());
            const transaction = await chevre.service.transaction.reserve.start({
                typeOf: chevre.factory.transactionType.Reserve,
                agent: {
                    typeOf: req.body.agent.typeOf,
                    // id: (req.body.agent.id !== undefined) ? req.body.agent.id : req.user.sub,
                    name: req.body.agent.name,
                    url: req.body.agent.url
                },
                object: {
                    // clientUser: req.user,
                    event: req.body.object.event,
                    tickets: req.body.object.tickets,
                    notes: (req.body.object.notes !== undefined) ? req.body.object.notes : ''
                },
                expires: moment(req.body.expires).toDate()
            })({
                eventAvailability: eventAvailabilityRepo,
                event: eventRepo,
                reservation: reservationRepo,
                reservationNumber: reservationNumberRepo,
                transaction: transactionRepo,
                ticketType: ticketTypeRepo
            });
            res.json(transaction);
        } catch (error) {
            next(error);
        }
    }
);

reserveTransactionsRouter.put(
    '/:transactionId/confirm',
    // permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const transactionRepo = new chevre.repository.Transaction(chevre.mongoose.connection);
            await chevre.service.transaction.reserve.confirm({
                transactionId: req.params.transactionId
            })({ transaction: transactionRepo });
            debug('transaction confirmed.');
            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);

reserveTransactionsRouter.put(
    '/:transactionId/cancel',
    // permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const transactionRepo = new chevre.repository.Transaction(chevre.mongoose.connection);
            await transactionRepo.cancel(chevre.factory.transactionType.Reserve, req.params.transactionId);
            debug('transaction canceled.');
            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);

export default reserveTransactionsRouter;