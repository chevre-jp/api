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
 * イベントルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const moment = require("moment");
const redis = require("../../redis");
const authentication_1 = require("../middlewares/authentication");
// import permitScopes from '../middlewares/permitScopes';
const validator_1 = require("../middlewares/validator");
const eventsRouter = express_1.Router();
eventsRouter.use(authentication_1.default);
eventsRouter.get('/screeningEventSeries', 
// permitScopes(['aws.cognito.signin.user.admin', 'events', 'events.read-only']),
(req, __, next) => {
    req.checkQuery('startFrom').optional().isISO8601().withMessage('startFrom must be ISO8601 timestamp');
    req.checkQuery('startThrough').optional().isISO8601().withMessage('startThrough must be ISO8601 timestamp');
    req.checkQuery('endFrom').optional().isISO8601().withMessage('endFrom must be ISO8601 timestamp');
    req.checkQuery('endThrough').optional().isISO8601().withMessage('endThrough must be ISO8601 timestamp');
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        const events = yield eventRepo.searchScreeningEventSeries({
            name: req.query.name,
            startFrom: (req.query.startFrom !== undefined) ? moment(req.query.startFrom).toDate() : undefined,
            startThrough: (req.query.startThrough !== undefined) ? moment(req.query.startThrough).toDate() : undefined,
            endFrom: (req.query.endFrom !== undefined) ? moment(req.query.endFrom).toDate() : undefined,
            endThrough: (req.query.endThrough !== undefined) ? moment(req.query.endThrough).toDate() : undefined,
            eventStatuses: (Array.isArray(req.query.eventStatuses)) ? req.query.eventStatuses : undefined,
            locationIds: (Array.isArray(req.query.locationIds)) ? req.query.locationIds : undefined,
            workPerformedIds: (Array.isArray(req.query.workPerformedIds)) ? req.query.workPerformedIds : undefined
        });
        res.json(events);
    }
    catch (error) {
        next(error);
    }
}));
eventsRouter.get('/screeningEvent', 
// permitScopes(['aws.cognito.signin.user.admin', 'events', 'events.read-only']),
(req, __, next) => {
    req.checkQuery('startFrom').optional().isISO8601().withMessage('startFrom must be ISO8601 timestamp');
    req.checkQuery('startThrough').optional().isISO8601().withMessage('startThrough must be ISO8601 timestamp');
    req.checkQuery('endFrom').optional().isISO8601().withMessage('endFrom must be ISO8601 timestamp');
    req.checkQuery('endThrough').optional().isISO8601().withMessage('endThrough must be ISO8601 timestamp');
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        const aggregationRepo = new chevre.repository.aggregation.ScreeningEvent(redis.getClient());
        let events = yield eventRepo.searchScreeningEvents({
            name: req.query.name,
            startFrom: (req.query.startFrom !== undefined) ? moment(req.query.startFrom).toDate() : undefined,
            startThrough: (req.query.startThrough !== undefined) ? moment(req.query.startThrough).toDate() : undefined,
            endFrom: (req.query.endFrom !== undefined) ? moment(req.query.endFrom).toDate() : undefined,
            endThrough: (req.query.endThrough !== undefined) ? moment(req.query.endThrough).toDate() : undefined,
            eventStatuses: (Array.isArray(req.query.eventStatuses)) ? req.query.eventStatuses : undefined,
            superEventLocationIds: (Array.isArray(req.query.superEventLocationIds)) ? req.query.superEventLocationIds : undefined,
            workPerformedIds: (Array.isArray(req.query.workPerformedIds)) ? req.query.workPerformedIds : undefined
        });
        // 集計情報を追加
        const aggregations = yield aggregationRepo.findAll();
        events = events.map((e) => {
            return Object.assign({}, e, aggregations[e.id]);
        });
        res.json(events);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 個々の上映イベントに対する券種検索
 */
eventsRouter.get('/screeningEvent/:id/ticketTypes', 
// permitScopes(['aws.cognito.signin.user.admin', 'events', 'events.read-only']),
(_1, _2, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
        const event = yield eventRepo.findById({
            typeOf: chevre.factory.eventType.ScreeningEvent,
            id: req.params.id
        });
        const ticketTypes = yield ticketTypeRepo.findByTicketGroupId({ ticketGroupId: event.ticketTypeGroup });
        res.json(ticketTypes);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 個々の上映イベントに対する座席オファー検索
 */
eventsRouter.get('/screeningEvent/:id/offers', 
// permitScopes(['aws.cognito.signin.user.admin', 'events', 'events.read-only']),
(_1, _2, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventAvailabilityRepo = new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient());
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
        const event = yield eventRepo.findById({
            typeOf: chevre.factory.eventType.ScreeningEvent,
            id: req.params.id
        });
        const unavailableOffers = yield eventAvailabilityRepo.findUnavailableOffersByEventId({ eventId: req.params.id });
        const movieTheater = yield placeRepo.findMovieTheaterByBranchCode(event.superEvent.location.branchCode);
        const screeningRoom = movieTheater.containsPlace.find((p) => p.branchCode === event.location.branchCode);
        if (screeningRoom === undefined) {
            throw new chevre.factory.errors.NotFound('Screening room');
        }
        const screeningRoomSections = screeningRoom.containsPlace;
        const offers = screeningRoomSections;
        offers.forEach((offer) => {
            const seats = offer.containsPlace;
            const seatSection = offer.branchCode;
            seats.forEach((seat) => {
                const seatNumber = seat.branchCode;
                const unavailableOffer = unavailableOffers.find((o) => o.seatSection === seatSection && o.seatNumber === seatNumber);
                seat.offers = [{
                        typeOf: 'Offer',
                        availability: (unavailableOffer !== undefined)
                            ? chevre.factory.itemAvailability.OutOfStock
                            : chevre.factory.itemAvailability.InStock
                    }];
            });
        });
        res.json(screeningRoomSections);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = eventsRouter;
