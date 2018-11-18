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
 * 上映イベントルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const redis = require("../../../redis");
const authentication_1 = require("../../middlewares/authentication");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const screeningEventRouter = express_1.Router();
screeningEventRouter.use(authentication_1.default);
screeningEventRouter.post('', permitScopes_1.default(['admin']), ...[
    check_1.body('typeOf').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('doorTime').optional().isISO8601().toDate(),
    check_1.body('startDate').not().isEmpty().withMessage((_, options) => `${options.path} is required`)
        .isISO8601().toDate(),
    check_1.body('endDate').not().isEmpty().withMessage((_, options) => `${options.path} is required`)
        .isISO8601().toDate(),
    check_1.body('workPerformed').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('location').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('superEvent').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('name').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('eventStatus').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('offers').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('offers.availabilityStarts').not().isEmpty().isISO8601().toDate(),
    check_1.body('offers.availabilityEnds').not().isEmpty().isISO8601().toDate(),
    check_1.body('offers.validFrom').not().isEmpty().isISO8601().toDate(),
    check_1.body('offers.validThrough').not().isEmpty().isISO8601().toDate()
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventAttributes = req.body;
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        const event = yield eventRepo.saveScreeningEvent({ attributes: eventAttributes });
        const aggregateTask = {
            name: chevre.factory.taskName.AggregateScreeningEvent,
            status: chevre.factory.taskStatus.Ready,
            runsAt: new Date(),
            remainingNumberOfTries: 3,
            lastTriedAt: null,
            numberOfTried: 0,
            executionResults: [],
            data: event
        };
        const taskRepo = new chevre.repository.Task(chevre.mongoose.connection);
        yield taskRepo.save(aggregateTask);
        res.status(http_status_1.CREATED).json(event);
    }
    catch (error) {
        next(error);
    }
}));
screeningEventRouter.get('', permitScopes_1.default(['admin', 'events', 'events.read-only']), ...[
    check_1.query('inSessionFrom').optional().isISO8601().toDate(),
    check_1.query('inSessionThrough').optional().isISO8601().toDate(),
    check_1.query('startFrom').optional().isISO8601().toDate(),
    check_1.query('startThrough').optional().isISO8601().toDate(),
    check_1.query('endFrom').optional().isISO8601().toDate(),
    check_1.query('endThrough').optional().isISO8601().toDate(),
    check_1.query('offers.availableFrom').optional().isISO8601().toDate(),
    check_1.query('offers.availableThrough').optional().isISO8601().toDate(),
    check_1.query('offers.validFrom').optional().isISO8601().toDate(),
    check_1.query('offers.validThrough').optional().isISO8601().toDate()
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        const searchCoinditions = Object.assign({}, req.query, { 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const events = yield eventRepo.searchScreeningEvents(searchCoinditions);
        const totalCount = yield eventRepo.countScreeningEvents(searchCoinditions);
        res.set('X-Total-Count', totalCount.toString());
        res.json(events);
    }
    catch (error) {
        next(error);
    }
}));
screeningEventRouter.get('/:id', permitScopes_1.default(['admin', 'events', 'events.read-only']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        const event = yield eventRepo.findById({
            typeOf: chevre.factory.eventType.ScreeningEvent,
            id: req.params.id
        });
        res.json(event);
    }
    catch (error) {
        next(error);
    }
}));
screeningEventRouter.put('/:id', permitScopes_1.default(['admin']), ...[
    check_1.body('typeOf').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('doorTime').optional().isISO8601().toDate(),
    check_1.body('startDate').not().isEmpty().withMessage((_, options) => `${options.path} is required`)
        .isISO8601().toDate(),
    check_1.body('endDate').not().isEmpty().withMessage((_, options) => `${options.path} is required`)
        .isISO8601().toDate(),
    check_1.body('workPerformed').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('location').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('superEvent').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('name').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('eventStatus').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('offers').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('offers.availabilityStarts').not().isEmpty().isISO8601().toDate(),
    check_1.body('offers.availabilityEnds').not().isEmpty().isISO8601().toDate(),
    check_1.body('offers.validFrom').not().isEmpty().isISO8601().toDate(),
    check_1.body('offers.validThrough').not().isEmpty().isISO8601().toDate()
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventAttributes = req.body;
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        const event = yield eventRepo.saveScreeningEvent({ id: req.params.id, attributes: eventAttributes });
        const aggregateTask = {
            name: chevre.factory.taskName.AggregateScreeningEvent,
            status: chevre.factory.taskStatus.Ready,
            runsAt: new Date(),
            remainingNumberOfTries: 3,
            lastTriedAt: null,
            numberOfTried: 0,
            executionResults: [],
            data: event
        };
        const taskRepo = new chevre.repository.Task(chevre.mongoose.connection);
        yield taskRepo.save(aggregateTask);
        res.status(http_status_1.NO_CONTENT).end();
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 上映イベントに対する座席オファー検索
 */
screeningEventRouter.get('/:id/offers', permitScopes_1.default(['admin', 'events', 'events.read-only']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
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
                        priceCurrency: chevre.factory.priceCurrency.JPY,
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
/**
 * 上映イベントに対するチケットオファー検索
 */
screeningEventRouter.get('/:id/offers/ticket', permitScopes_1.default(['admin', 'events', 'events.read-only']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
        const priceSpecificationRepo = new chevre.repository.PriceSpecification(chevre.mongoose.connection);
        const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
        const offers = yield chevre.service.offer.searchScreeningEventTicketOffers({ eventId: req.params.id })({
            event: eventRepo,
            priceSpecification: priceSpecificationRepo,
            ticketType: ticketTypeRepo
        });
        res.json(offers);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = screeningEventRouter;
