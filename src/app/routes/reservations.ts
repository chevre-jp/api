/**
 * 予約ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import * as moment from 'moment';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const reservationsRouter = Router();
reservationsRouter.use(authentication);
reservationsRouter.get(
    '/eventReservation/screeningEvent',
    permitScopes(['admin', 'reservations', 'reservations.read-only']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const reservationRepo = new chevre.repository.Reservation(chevre.mongoose.connection);
            const searchCoinditions: chevre.factory.reservation.event.ISearchConditions = {
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : /* istanbul ignore next*/ 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : /* istanbul ignore next*/ 1,
                reservationStatuses: (Array.isArray(req.query.reservationStatuses)) ? req.query.reservationStatuses : undefined,
                ids: (Array.isArray(req.query.ids)) ? req.query.ids : undefined,
                reservationFor: req.query.reservationFor,
                modifiedFrom: (req.query.modifiedFrom !== undefined) ? moment(req.query.modifiedFrom).toDate() : undefined,
                modifiedThrough: (req.query.modifiedThrough !== undefined) ? moment(req.query.modifiedThrough).toDate() : undefined
            };
            const totalCount = await reservationRepo.countScreeningEventReservations(searchCoinditions);
            const reservations = await reservationRepo.searchScreeningEventReservations(searchCoinditions);
            res.set('Total-Count', totalCount.toString());
            res.json(reservations);
        } catch (error) {
            next(error);
        }
    }
);
reservationsRouter.get(
    '/eventReservation/screeningEvent/:id',
    permitScopes(['admin', 'reservations', 'reservations.read-only']),
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
