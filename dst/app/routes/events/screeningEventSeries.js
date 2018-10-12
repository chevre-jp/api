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
 * 上映イベントシリーズルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const http_status_1 = require("http-status");
const moment = require("moment");
const authentication_1 = require("../../middlewares/authentication");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const screeningEventSeriesRouter = express_1.Router();
screeningEventSeriesRouter.use(authentication_1.default);
screeningEventSeriesRouter.post('', permitScopes_1.default(['admin']), (_, __, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventAttributes = {
            typeOf: chevre.factory.eventType.ScreeningEventSeries,
            name: req.body.name,
            kanaName: req.body.kanaName,
            alternativeHeadline: req.body.alternativeHeadline,
            location: req.body.location,
            videoFormat: req.body.videoFormat,
            soundFormat: req.body.soundFormat,
            subtitleLanguage: req.body.subtitleLanguage,
            workPerformed: req.body.workPerformed,
            duration: (req.body.duration !== undefined) ? moment.duration(req.body.duration).toISOString() : undefined,
            startDate: (req.body.startDate !== undefined) ? moment(req.body.startDate).toDate() : undefined,
            endDate: (req.body.endDate !== undefined) ? moment(req.body.endDate).toDate() : undefined,
            eventStatus: req.body.eventStatus
        };
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        const event = yield eventRepo.saveScreeningEventSeries({ attributes: eventAttributes });
        res.status(http_status_1.CREATED).json(event);
    }
    catch (error) {
        next(error);
    }
}));
screeningEventSeriesRouter.get('', permitScopes_1.default(['admin', 'events', 'events.read-only']), (req, __, next) => {
    req.checkQuery('inSessionFrom').optional().isISO8601().withMessage('inSessionFrom must be ISO8601 timestamp');
    req.checkQuery('inSessionThrough').optional().isISO8601().withMessage('inSessionThrough must be ISO8601 timestamp');
    req.checkQuery('startFrom').optional().isISO8601().withMessage('startFrom must be ISO8601 timestamp');
    req.checkQuery('startThrough').optional().isISO8601().withMessage('startThrough must be ISO8601 timestamp');
    req.checkQuery('endFrom').optional().isISO8601().withMessage('endFrom must be ISO8601 timestamp');
    req.checkQuery('endThrough').optional().isISO8601().withMessage('endThrough must be ISO8601 timestamp');
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        const searchCoinditions = {
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
            page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
            sort: req.query.sort,
            name: req.query.name,
            inSessionFrom: (req.query.inSessionFrom !== undefined) ? moment(req.query.inSessionFrom).toDate() : undefined,
            inSessionThrough: (req.query.inSessionThrough !== undefined) ? moment(req.query.inSessionThrough).toDate() : undefined,
            startFrom: (req.query.startFrom !== undefined) ? moment(req.query.startFrom).toDate() : undefined,
            startThrough: (req.query.startThrough !== undefined) ? moment(req.query.startThrough).toDate() : undefined,
            endFrom: (req.query.endFrom !== undefined) ? moment(req.query.endFrom).toDate() : undefined,
            endThrough: (req.query.endThrough !== undefined) ? moment(req.query.endThrough).toDate() : undefined,
            eventStatuses: (Array.isArray(req.query.eventStatuses)) ? req.query.eventStatuses : undefined,
            location: req.query.location,
            workPerformed: req.query.workPerformed
        };
        const events = yield eventRepo.searchScreeningEventSeries(searchCoinditions);
        const totalCount = yield eventRepo.countScreeningEventSeries(searchCoinditions);
        res.set('X-Total-Count', totalCount.toString());
        res.json(events);
    }
    catch (error) {
        next(error);
    }
}));
screeningEventSeriesRouter.get('/:id', permitScopes_1.default(['admin', 'events', 'events.read-only']), (_, __, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        const event = yield eventRepo.findById({
            typeOf: chevre.factory.eventType.ScreeningEventSeries,
            id: req.params.id
        });
        res.json(event);
    }
    catch (error) {
        next(error);
    }
}));
screeningEventSeriesRouter.put('/:id', permitScopes_1.default(['admin']), (_, __, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventAttributes = {
            typeOf: chevre.factory.eventType.ScreeningEventSeries,
            name: req.body.name,
            kanaName: req.body.kanaName,
            alternativeHeadline: req.body.alternativeHeadline,
            location: req.body.location,
            videoFormat: req.body.videoFormat,
            soundFormat: req.body.soundFormat,
            subtitleLanguage: req.body.subtitleLanguage,
            workPerformed: req.body.workPerformed,
            duration: (req.body.duration !== undefined) ? moment.duration(req.body.duration).toISOString() : undefined,
            startDate: (req.body.startDate !== undefined) ? moment(req.body.startDate).toDate() : undefined,
            endDate: (req.body.endDate !== undefined) ? moment(req.body.endDate).toDate() : undefined,
            eventStatus: req.body.eventStatus
        };
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        yield eventRepo.saveScreeningEventSeries({ id: req.params.id, attributes: eventAttributes });
        res.status(http_status_1.NO_CONTENT).end();
    }
    catch (error) {
        next(error);
    }
}));
screeningEventSeriesRouter.delete('/:id', permitScopes_1.default(['admin']), (_, __, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        yield eventRepo.deleteById({
            typeOf: chevre.factory.eventType.ScreeningEventSeries,
            id: req.params.id
        });
        res.status(http_status_1.NO_CONTENT).end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = screeningEventSeriesRouter;
