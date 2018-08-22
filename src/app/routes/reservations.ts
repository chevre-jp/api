/**
 * 予約ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';

import authentication from '../middlewares/authentication';
// import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const reservationsRouter = Router();
reservationsRouter.use(authentication);

reservationsRouter.get(
    '/eventReservation/screeningEvent',
    // permitScopes(['aws.cognito.signin.user.admin', 'events', 'events.read-only']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const reservationRepo = new chevre.repository.Reservation(chevre.mongoose.connection);
            const reservations = await reservationRepo.searchScreeningEventReservations({
                reservationStatuses: (Array.isArray(req.query.reservationStatuses)) ? req.query.reservationStatuses : undefined,
                ids: (Array.isArray(req.query.ids)) ? req.query.ids : undefined
            });
            res.json(reservations);
        } catch (error) {
            next(error);
        }
    }
);

reservationsRouter.get(
    '/eventReservation/screeningEvent/:id',
    // permitScopes(['aws.cognito.signin.user.admin', 'events', 'events.read-only']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const reservationRepo = new chevre.repository.Reservation(chevre.mongoose.connection);
            const reservation = await reservationRepo.findScreeningEventReservationById({
                id: req.params.id
            });
            res.json(reservation);
        } catch (error) {
            next(error);
        }
    }
);

export default reservationsRouter;
