/**
 * 予約ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { query } from 'express-validator/check';
import { NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const reservationsRouter = Router();
reservationsRouter.use(authentication);

reservationsRouter.get(
    '/eventReservation/screeningEvent',
    permitScopes(['admin', 'reservations', 'reservations.read-only']),
    ...[
        query('modifiedFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('modifiedThrough')
            .optional()
            .isISO8601()
            .toDate(),
        query('reservationFor.startFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('reservationFor.startThrough')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
            const searchCoinditions: chevre.factory.reservation.event.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };
            const totalCount = await reservationRepo.countScreeningEventReservations(searchCoinditions);
            const reservations = await reservationRepo.searchScreeningEventReservations(searchCoinditions);
            res.set('X-Total-Count', totalCount.toString());
            res.json(reservations);
        } catch (error) {
            next(error);
        }
    }
);

reservationsRouter.get(
    '/eventReservation/screeningEvent/:id',
    permitScopes(['admin', 'reservations', 'reservations.read-only']),
    validator,
    async (req, res, next) => {
        try {
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
            const reservation = await reservationRepo.findScreeningEventReservationById({
                id: req.params.id
            });

            res.json(reservation);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 発券
 */
reservationsRouter.put(
    '/eventReservation/screeningEvent/checkedIn',
    permitScopes(['admin', 'reservations.checkedIn']),
    validator,
    async (req, res, next) => {
        try {
            if (req.body.id === undefined && req.body.reservationNumber === undefined) {
                throw new chevre.factory.errors.ArgumentNull('At least one of id and reservationNumber');
            }

            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);

            const reservations = await reservationRepo.searchScreeningEventReservations({
                limit: 1,
                ids: (req.body.id !== undefined) ? [req.body.id] : undefined,
                reservationNumbers: (req.body.reservationNumber !== undefined) ? [req.body.reservationNumber] : undefined
            });
            const reservation = reservations.shift();
            if (reservation === undefined) {
                throw new chevre.factory.errors.NotFound('Reservation');
            }

            await reservationRepo.checkIn({
                id: req.body.id,
                reservationNumber: req.body.reservationNumber
            });

            // 上映イベント集計タスクを追加
            const aggregateTask: chevre.factory.task.aggregateScreeningEvent.IAttributes = {
                name: chevre.factory.taskName.AggregateScreeningEvent,
                status: chevre.factory.taskStatus.Ready,
                runsAt: new Date(),
                remainingNumberOfTries: 3,
                // tslint:disable-next-line:no-null-keyword
                lastTriedAt: null,
                numberOfTried: 0,
                executionResults: [],
                data: {
                    typeOf: reservation.reservationFor.typeOf,
                    id: reservation.reservationFor.id
                }
            };
            await taskRepo.save(aggregateTask);

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

reservationsRouter.put(
    '/eventReservation/screeningEvent/:id/checkedIn',
    permitScopes(['admin', 'reservations.checkedIn']),
    validator,
    async (req, res, next) => {
        try {
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);

            // 上映イベント集計タスクを追加
            const reservation = await reservationRepo.findScreeningEventReservationById({
                id: req.params.id
            });

            await reservationRepo.checkIn({
                id: req.params.id
            });

            const aggregateTask: chevre.factory.task.aggregateScreeningEvent.IAttributes = {
                name: chevre.factory.taskName.AggregateScreeningEvent,
                status: chevre.factory.taskStatus.Ready,
                runsAt: new Date(),
                remainingNumberOfTries: 3,
                // tslint:disable-next-line:no-null-keyword
                lastTriedAt: null,
                numberOfTried: 0,
                executionResults: [],
                data: {
                    typeOf: reservation.reservationFor.typeOf,
                    id: reservation.reservationFor.id
                }
            };
            await taskRepo.save(aggregateTask);

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

reservationsRouter.put(
    '/eventReservation/screeningEvent/:id/attended',
    permitScopes(['admin', 'reservations.attended']),
    validator,
    async (req, res, next) => {
        try {
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);

            const reservation = await reservationRepo.attend({
                id: req.params.id
            });

            const aggregateTask: chevre.factory.task.aggregateScreeningEvent.IAttributes = {
                name: chevre.factory.taskName.AggregateScreeningEvent,
                status: chevre.factory.taskStatus.Ready,
                runsAt: new Date(),
                remainingNumberOfTries: 3,
                // tslint:disable-next-line:no-null-keyword
                lastTriedAt: null,
                numberOfTried: 0,
                executionResults: [],
                data: {
                    typeOf: reservation.reservationFor.typeOf,
                    id: reservation.reservationFor.id
                }
            };
            await taskRepo.save(aggregateTask);

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default reservationsRouter;
