"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 予約ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
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
    express_validator_1.query('limit')
        .optional()
        .isInt()
        .toInt(),
    express_validator_1.query('page')
        .optional()
        .isInt()
        .toInt(),
    express_validator_1.query('bookingFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('bookingThrough')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('modifiedFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('modifiedThrough')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('reservationFor.startFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('reservationFor.startThrough')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('reservationFor.endFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('reservationFor.endThrough')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('checkedIn')
        .optional()
        .isBoolean()
        .toBoolean(),
    express_validator_1.query('attended')
        .optional()
        .isBoolean()
        .toBoolean()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const countDocuments = req.query.countDocuments === '1';
        const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1, sort: { bookingTime: chevre.factory.sortType.Descending } });
        const reservations = yield reservationRepo.search(searchConditions);
        if (countDocuments) {
            const totalCount = yield reservationRepo.count(searchConditions);
            res.set('X-Total-Count', totalCount.toString());
        }
        res.json(reservations);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * ストリーミングダウンロード
 */
reservationsRouter.get('/download', permitScopes_1.default(['admin']), ...[
    express_validator_1.query('limit')
        .optional()
        .isInt()
        .toInt(),
    express_validator_1.query('page')
        .optional()
        .isInt()
        .toInt(),
    express_validator_1.query('bookingFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('bookingThrough')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('modifiedFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('modifiedThrough')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('reservationFor.startFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('reservationFor.startThrough')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('reservationFor.endFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('reservationFor.endThrough')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('checkedIn')
        .optional()
        .isBoolean()
        .toBoolean(),
    express_validator_1.query('attended')
        .optional()
        .isBoolean()
        .toBoolean()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
        const searchConditions = Object.assign({}, req.query);
        const format = req.query.format;
        const stream = yield chevre.service.report.reservation.stream({
            conditions: searchConditions,
            format: format
        })({ reservation: reservationRepo });
        res.type(`${req.query.format}; charset=utf-8`);
        stream.pipe(res);
    }
    catch (error) {
        next(error);
    }
}));
reservationsRouter.get('/:id', permitScopes_1.default(['admin', 'reservations', 'reservations.read-only']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
 * 予約部分変更
 */
reservationsRouter.patch('/:id', permitScopes_1.default(['admin', 'reservations.write']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const update = req.body;
        delete update.id;
        const actionRepo = new chevre.repository.Action(mongoose.connection);
        const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
        // 予約存在確認
        const reservation = yield reservationRepo.findById({ id: req.params.id });
        const actionAttributes = Object.assign({ project: reservation.project, typeOf: 'ReplaceAction', agent: Object.assign(Object.assign({}, req.user), { id: req.user.sub, typeOf: 'Person' }), object: reservation }, {
            replacee: reservation,
            replacer: update,
            targetCollection: {
                typeOf: reservation.typeOf,
                id: reservation.id
            }
        });
        const action = yield actionRepo.start(actionAttributes);
        try {
            const doc = yield reservationRepo.reservationModel.findOneAndUpdate({ _id: req.params.id }, update)
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound(reservationRepo.reservationModel.modelName);
            }
        }
        catch (error) {
            // actionにエラー結果を追加
            try {
                const actionError = Object.assign(Object.assign({}, error), { message: error.message, name: error.name });
                yield actionRepo.giveUp({ typeOf: action.typeOf, id: action.id, error: actionError });
            }
            catch (__) {
                // 失敗したら仕方ない
            }
            throw error;
        }
        // アクション完了
        yield actionRepo.complete({ typeOf: action.typeOf, id: action.id, result: {} });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
reservationsRouter.get('/eventReservation/screeningEvent', permitScopes_1.default(['admin', 'reservations', 'reservations.read-only']), ...[
    express_validator_1.query('limit')
        .optional()
        .isInt()
        .toInt(),
    express_validator_1.query('page')
        .optional()
        .isInt()
        .toInt(),
    express_validator_1.query('bookingFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('bookingThrough')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('modifiedFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('modifiedThrough')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('reservationFor.startFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('reservationFor.startThrough')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('reservationFor.endFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('reservationFor.endThrough')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('checkedIn')
        .optional()
        .isBoolean()
        .toBoolean(),
    express_validator_1.query('attended')
        .optional()
        .isBoolean()
        .toBoolean()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { typeOf: chevre.factory.reservationType.EventReservation, 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1, sort: { bookingTime: chevre.factory.sortType.Descending } });
        const reservations = yield reservationRepo.search(searchConditions);
        res.json(reservations);
    }
    catch (error) {
        next(error);
    }
}));
reservationsRouter.get('/eventReservation/screeningEvent/:id', permitScopes_1.default(['admin', 'reservations', 'reservations.read-only']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
reservationsRouter.put('/eventReservation/screeningEvent/checkedIn', permitScopes_1.default(['admin', 'reservations.checkedIn']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
reservationsRouter.put('/eventReservation/screeningEvent/:id/checkedIn', permitScopes_1.default(['admin', 'reservations.checkedIn']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
reservationsRouter.put('/eventReservation/screeningEvent/:id/attended', permitScopes_1.default(['admin', 'reservations.attended']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const actionRepo = new chevre.repository.Action(mongoose.connection);
        const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const reservation = yield reservationRepo.findById({ id: req.params.id });
        // UseActionを作成する
        const actionAttributes = Object.assign({ project: reservation.project, typeOf: chevre.factory.actionType.UseAction, agent: {
                typeOf: 'Person'
            }, instrument: Object.assign({}, (typeof ((_a = req.body.instrument) === null || _a === void 0 ? void 0 : _a.token) === 'string')
                ? { token: req.body.instrument.token }
                : undefined), 
            // どの予約を
            object: [reservation] }, (typeof ((_b = req.body.location) === null || _b === void 0 ? void 0 : _b.identifier) === 'string')
            ? {
                location: {
                    typeOf: chevre.factory.placeType.Place,
                    identifier: req.body.location.identifier
                }
            }
            : undefined
        // purpose: params.purpose
        );
        const action = yield actionRepo.start(actionAttributes);
        try {
            yield reservationRepo.attend({ id: reservation.id });
        }
        catch (error) {
            // actionにエラー結果を追加
            try {
                const actionError = Object.assign(Object.assign({}, error), { message: error.message, name: error.name });
                yield actionRepo.giveUp({ typeOf: action.typeOf, id: action.id, error: actionError });
            }
            catch (__) {
                // 失敗したら仕方ない
            }
            throw error;
        }
        // アクション完了
        yield actionRepo.complete({ typeOf: action.typeOf, id: action.id, result: {} });
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
        // res.status(NO_CONTENT)
        //     .end();
        res.json({ id: action.id });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = reservationsRouter;
