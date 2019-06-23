"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 予約ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const reservationsRouter = express_1.Router();
reservationsRouter.use(authentication_1.default);
/**
 * 予約検索
 */
reservationsRouter.get('', permitScopes_1.default(['admin', 'reservations', 'reservations.read-only']), ...[
    check_1.query('limit')
        .optional()
        .isInt()
        .toInt(),
    check_1.query('page')
        .optional()
        .isInt()
        .toInt(),
    check_1.query('modifiedFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('modifiedThrough')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('reservationFor.startFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('reservationFor.startThrough')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('reservationFor.endFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('reservationFor.endThrough')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('checkedIn')
        .optional()
        .isBoolean()
        .toBoolean(),
    check_1.query('attended')
        .optional()
        .isBoolean()
        .toBoolean()
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
        const searchCoinditions = Object.assign({}, req.query, { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1, sort: (req.query.sort !== undefined && req.query.sort.modifiedTime !== undefined)
                ? { modifiedTime: req.query.sort.modifiedTime }
                : undefined });
        const totalCount = yield reservationRepo.count(searchCoinditions);
        const reservations = yield reservationRepo.search(searchCoinditions);
        res.set('X-Total-Count', totalCount.toString())
            .json(reservations);
    }
    catch (error) {
        next(error);
    }
}));
reservationsRouter.get('/:id', permitScopes_1.default(['admin', 'reservations', 'reservations.read-only']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
        const reservation = yield reservationRepo.findById({
            id: req.params.id
        });
        res.json(reservation);
    }
    catch (error) {
        next(error);
    }
}));
reservationsRouter.get('/eventReservation/screeningEvent', permitScopes_1.default(['admin', 'reservations', 'reservations.read-only']), ...[
    check_1.query('limit')
        .optional()
        .isInt()
        .toInt(),
    check_1.query('page')
        .optional()
        .isInt()
        .toInt(),
    check_1.query('modifiedFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('modifiedThrough')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('reservationFor.startFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('reservationFor.startThrough')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('reservationFor.endFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('reservationFor.endThrough')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('checkedIn')
        .optional()
        .isBoolean()
        .toBoolean(),
    check_1.query('attended')
        .optional()
        .isBoolean()
        .toBoolean()
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
        const searchCoinditions = Object.assign({}, req.query, { typeOf: chevre.factory.reservationType.EventReservation, 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1, sort: (req.query.sort !== undefined && req.query.sort.modifiedTime !== undefined)
                ? { modifiedTime: req.query.sort.modifiedTime }
                : undefined });
        const totalCount = yield reservationRepo.count(searchCoinditions);
        const reservations = yield reservationRepo.search(searchCoinditions);
        res.set('X-Total-Count', totalCount.toString())
            .json(reservations);
    }
    catch (error) {
        next(error);
    }
}));
reservationsRouter.get('/eventReservation/screeningEvent/:id', permitScopes_1.default(['admin', 'reservations', 'reservations.read-only']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
        const reservation = yield reservationRepo.findById({
            id: req.params.id
        });
        res.json(reservation);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 発券
 */
reservationsRouter.put('/eventReservation/screeningEvent/checkedIn', permitScopes_1.default(['admin', 'reservations.checkedIn']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        if (req.body.id === undefined && req.body.reservationNumber === undefined) {
            throw new chevre.factory.errors.ArgumentNull('At least one of id and reservationNumber');
        }
        const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const reservations = yield reservationRepo.search({
            limit: 1,
            typeOf: chevre.factory.reservationType.EventReservation,
            ids: (req.body.id !== undefined) ? [req.body.id] : undefined,
            reservationNumbers: (req.body.reservationNumber !== undefined) ? [req.body.reservationNumber] : undefined
        });
        const reservation = reservations.shift();
        if (reservation === undefined) {
            throw new chevre.factory.errors.NotFound('Reservation');
        }
        yield reservationRepo.checkIn({
            id: req.body.id,
            reservationNumber: req.body.reservationNumber
        });
        // 上映イベント集計タスクを追加
        const aggregateTask = {
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
        yield taskRepo.save(aggregateTask);
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
reservationsRouter.put('/eventReservation/screeningEvent/:id/checkedIn', permitScopes_1.default(['admin', 'reservations.checkedIn']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        // 上映イベント集計タスクを追加
        const reservation = yield reservationRepo.findById({
            id: req.params.id
        });
        yield reservationRepo.checkIn({
            id: req.params.id
        });
        const aggregateTask = {
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
        yield taskRepo.save(aggregateTask);
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
reservationsRouter.put('/eventReservation/screeningEvent/:id/attended', permitScopes_1.default(['admin', 'reservations.attended']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const reservation = yield reservationRepo.attend({
            id: req.params.id
        });
        const aggregateTask = {
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
        yield taskRepo.save(aggregateTask);
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = reservationsRouter;
