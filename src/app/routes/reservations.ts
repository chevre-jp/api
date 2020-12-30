/**
 * 予約ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { query } from 'express-validator';
import { NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const reservationsRouter = Router();
reservationsRouter.use(authentication);

/**
 * 予約検索
 */
reservationsRouter.get(
    '',
    permitScopes(['admin', 'reservations', 'reservations.read-only']),
    ...[
        query('limit')
            .optional()
            .isInt()
            .toInt(),
        query('page')
            .optional()
            .isInt()
            .toInt(),
        query('bookingFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('bookingThrough')
            .optional()
            .isISO8601()
            .toDate(),
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
            .toDate(),
        query('reservationFor.endFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('reservationFor.endThrough')
            .optional()
            .isISO8601()
            .toDate(),
        query('checkedIn')
            .optional()
            .isBoolean()
            .toBoolean(),
        query('attended')
            .optional()
            .isBoolean()
            .toBoolean()
    ],
    validator,
    async (req, res, next) => {
        try {
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
            const searchConditions: chevre.factory.reservation.ISearchConditions<any> = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
                sort: { bookingTime: chevre.factory.sortType.Descending }
            };

            const reservations = await reservationRepo.search(searchConditions);

            res.json(reservations);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * ストリーミングダウンロード
 */
reservationsRouter.get(
    '/download',
    permitScopes(['admin']),
    ...[
        query('limit')
            .optional()
            .isInt()
            .toInt(),
        query('page')
            .optional()
            .isInt()
            .toInt(),
        query('bookingFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('bookingThrough')
            .optional()
            .isISO8601()
            .toDate(),
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
            .toDate(),
        query('reservationFor.endFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('reservationFor.endThrough')
            .optional()
            .isISO8601()
            .toDate(),
        query('checkedIn')
            .optional()
            .isBoolean()
            .toBoolean(),
        query('attended')
            .optional()
            .isBoolean()
            .toBoolean()
    ],
    validator,
    async (req, res, next) => {
        try {
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);

            const searchConditions: chevre.factory.reservation.ISearchConditions<any> = {
                ...req.query
            };

            const format = req.query.format;

            const stream = await chevre.service.report.reservation.stream({
                conditions: searchConditions,
                format: format
            })({ reservation: reservationRepo });

            res.type(`${req.query.format}; charset=utf-8`);
            stream.pipe(res);
        } catch (error) {
            next(error);
        }
    }
);

reservationsRouter.get(
    '/:id',
    permitScopes(['admin', 'reservations', 'reservations.read-only']),
    validator,
    async (req, res, next) => {
        try {
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
            const reservation = await reservationRepo.findById({
                id: req.params.id
            });

            res.json(reservation);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 予約部分変更
 */
reservationsRouter.patch(
    '/:id',
    permitScopes(['admin', 'reservations.write']),
    validator,
    async (req, res, next) => {
        try {
            const update: any = req.body;
            delete update.id;

            const actionRepo = new chevre.repository.Action(mongoose.connection);
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);

            // 予約存在確認
            const reservation = await reservationRepo.findById({ id: req.params.id });

            const actionAttributes: chevre.factory.action.IAttributes<any, any, any> = {
                project: reservation.project,
                typeOf: 'ReplaceAction',
                agent: {
                    ...req.user,
                    id: req.user.sub,
                    typeOf: 'Person'
                },
                object: reservation,
                ...{
                    replacee: reservation,
                    replacer: update,
                    targetCollection: {
                        typeOf: reservation.typeOf,
                        id: reservation.id
                    }
                }
            };
            const action = await actionRepo.start<any>(actionAttributes);

            try {

                const doc = await reservationRepo.reservationModel.findOneAndUpdate(
                    { _id: req.params.id },
                    update
                )
                    .exec();
                if (doc === null) {
                    throw new chevre.factory.errors.NotFound(reservationRepo.reservationModel.modelName);
                }
            } catch (error) {
                // actionにエラー結果を追加
                try {
                    const actionError = { ...error, message: error.message, name: error.name };
                    await actionRepo.giveUp({ typeOf: action.typeOf, id: action.id, error: actionError });
                } catch (__) {
                    // 失敗したら仕方ない
                }

                throw error;
            }

            // アクション完了
            await actionRepo.complete({ typeOf: action.typeOf, id: action.id, result: {} });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

reservationsRouter.get(
    '/eventReservation/screeningEvent',
    permitScopes(['admin', 'reservations', 'reservations.read-only']),
    ...[
        query('limit')
            .optional()
            .isInt()
            .toInt(),
        query('page')
            .optional()
            .isInt()
            .toInt(),
        query('bookingFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('bookingThrough')
            .optional()
            .isISO8601()
            .toDate(),
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
            .toDate(),
        query('reservationFor.endFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('reservationFor.endThrough')
            .optional()
            .isISO8601()
            .toDate(),
        query('checkedIn')
            .optional()
            .isBoolean()
            .toBoolean(),
        query('attended')
            .optional()
            .isBoolean()
            .toBoolean()
    ],
    validator,
    async (req, res, next) => {
        try {
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
            const searchConditions: chevre.factory.reservation.ISearchConditions<chevre.factory.reservationType.EventReservation> = {
                ...req.query,
                typeOf: chevre.factory.reservationType.EventReservation,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
                sort: { bookingTime: chevre.factory.sortType.Descending }
            };

            const reservations = await reservationRepo.search(searchConditions);

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
            const reservation = await reservationRepo.findById({
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

            const reservations = await reservationRepo.search({
                limit: 1,
                typeOf: chevre.factory.reservationType.EventReservation,
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
                project: reservation.project,
                name: chevre.factory.taskName.AggregateScreeningEvent,
                status: chevre.factory.taskStatus.Ready,
                runsAt: new Date(),
                remainingNumberOfTries: 3,
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
            const reservation = await reservationRepo.findById({
                id: req.params.id
            });

            await reservationRepo.checkIn({
                id: req.params.id
            });

            const aggregateTask: chevre.factory.task.aggregateScreeningEvent.IAttributes = {
                project: reservation.project,
                name: chevre.factory.taskName.AggregateScreeningEvent,
                status: chevre.factory.taskStatus.Ready,
                runsAt: new Date(),
                remainingNumberOfTries: 3,
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
            const actionRepo = new chevre.repository.Action(mongoose.connection);
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);

            const reservation = await reservationRepo.findById<chevre.factory.reservationType.EventReservation>({ id: req.params.id });

            // UseActionを作成する
            const actionAttributes: chevre.factory.action.IAttributes<chevre.factory.actionType.UseAction, any, any> = {
                project: reservation.project,
                typeOf: chevre.factory.actionType.UseAction,
                agent: {
                    typeOf: 'Person'
                },
                instrument: {
                    // どのトークンを使って
                    ...(typeof req.body.instrument?.token === 'string')
                        ? { token: req.body.instrument.token }
                        : undefined
                },
                // どの予約を
                object: [reservation],
                // どのエントランスで
                ...(typeof req.body.location?.identifier === 'string')
                    ? {
                        location: {
                            typeOf: chevre.factory.placeType.Place,
                            identifier: req.body.location.identifier
                        }
                    }
                    : undefined
                // purpose: params.purpose
            };
            const action = await actionRepo.start(actionAttributes);

            try {
                await reservationRepo.attend({ id: reservation.id });
            } catch (error) {
                // actionにエラー結果を追加
                try {
                    const actionError = { ...error, message: error.message, name: error.name };
                    await actionRepo.giveUp({ typeOf: action.typeOf, id: action.id, error: actionError });
                } catch (__) {
                    // 失敗したら仕方ない
                }

                throw error;
            }

            // アクション完了
            await actionRepo.complete({ typeOf: action.typeOf, id: action.id, result: {} });

            const aggregateTask: chevre.factory.task.aggregateScreeningEvent.IAttributes = {
                project: reservation.project,
                name: chevre.factory.taskName.AggregateScreeningEvent,
                status: chevre.factory.taskStatus.Ready,
                runsAt: new Date(),
                remainingNumberOfTries: 3,
                numberOfTried: 0,
                executionResults: [],
                data: {
                    typeOf: reservation.reservationFor.typeOf,
                    id: reservation.reservationFor.id
                }
            };
            await taskRepo.save(aggregateTask);

            // res.status(NO_CONTENT)
            //     .end();
            res.json({ id: action.id });
        } catch (error) {
            next(error);
        }
    }
);

export default reservationsRouter;
