/**
 * イベントルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import * as moment from 'moment';

import * as redis from '../../redis';
import authentication from '../middlewares/authentication';
// import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const eventsRouter = Router();
eventsRouter.use(authentication);

eventsRouter.get(
    '/screeningEventSeries',
    // permitScopes(['aws.cognito.signin.user.admin', 'events', 'events.read-only']),
    (req, __, next) => {
        req.checkQuery('startFrom').optional().isISO8601().withMessage('startFrom must be ISO8601 timestamp');
        req.checkQuery('startThrough').optional().isISO8601().withMessage('startThrough must be ISO8601 timestamp');
        req.checkQuery('endFrom').optional().isISO8601().withMessage('endFrom must be ISO8601 timestamp');
        req.checkQuery('endThrough').optional().isISO8601().withMessage('endThrough must be ISO8601 timestamp');

        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
            const events = await eventRepo.searchScreeningEventSeries({
                name: req.query.name,
                startFrom: (req.query.startFrom !== undefined) ? moment(req.query.startFrom).toDate() : undefined,
                startThrough: (req.query.startThrough !== undefined) ? moment(req.query.startThrough).toDate() : undefined,
                endFrom: (req.query.endFrom !== undefined) ? moment(req.query.endFrom).toDate() : undefined,
                endThrough: (req.query.endThrough !== undefined) ? moment(req.query.endThrough).toDate() : undefined,
                eventStatuses: (Array.isArray(req.query.eventStatuses)) ? req.query.eventStatuses : undefined,
                locationIds:
                    (Array.isArray(req.query.locationIds)) ? req.query.locationIds : undefined,
                workPerformedIds:
                    (Array.isArray(req.query.workPerformedIds)) ? req.query.workPerformedIds : undefined
            });
            res.json(events);
        } catch (error) {
            next(error);
        }
    }
);

eventsRouter.get(
    '/screeningEvent',
    // permitScopes(['aws.cognito.signin.user.admin', 'events', 'events.read-only']),
    (req, __, next) => {
        req.checkQuery('startFrom').optional().isISO8601().withMessage('startFrom must be ISO8601 timestamp');
        req.checkQuery('startThrough').optional().isISO8601().withMessage('startThrough must be ISO8601 timestamp');
        req.checkQuery('endFrom').optional().isISO8601().withMessage('endFrom must be ISO8601 timestamp');
        req.checkQuery('endThrough').optional().isISO8601().withMessage('endThrough must be ISO8601 timestamp');

        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
            const aggregationRepo = new chevre.repository.aggregation.ScreeningEvent(redis.getClient());
            let events = await eventRepo.searchScreeningEvents({
                name: req.query.name,
                startFrom: (req.query.startFrom !== undefined) ? moment(req.query.startFrom).toDate() : undefined,
                startThrough: (req.query.startThrough !== undefined) ? moment(req.query.startThrough).toDate() : undefined,
                endFrom: (req.query.endFrom !== undefined) ? moment(req.query.endFrom).toDate() : undefined,
                endThrough: (req.query.endThrough !== undefined) ? moment(req.query.endThrough).toDate() : undefined,
                eventStatuses: (Array.isArray(req.query.eventStatuses)) ? req.query.eventStatuses : undefined,
                superEventLocationIds:
                    (Array.isArray(req.query.superEventLocationIds)) ? req.query.superEventLocationIds : undefined,
                workPerformedIds:
                    (Array.isArray(req.query.workPerformedIds)) ? req.query.workPerformedIds : undefined
            });
            // 集計情報を追加
            const aggregations = await aggregationRepo.findAll();
            events = events.map((e) => {
                return { ...e, ...aggregations[e.id] };
            });
            res.json(events);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 個々の上映イベントに対する券種検索
 */
eventsRouter.get(
    '/screeningEvent/:id/ticketTypes',
    // permitScopes(['aws.cognito.signin.user.admin', 'events', 'events.read-only']),
    (_1, _2, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
            const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
            const event = await eventRepo.findById({
                typeOf: chevre.factory.eventType.ScreeningEvent,
                id: req.params.id
            });
            const ticketTypes = await ticketTypeRepo.findByTicketGroupId({ ticketGroupId: event.ticketTypeGroup });
            res.json(ticketTypes);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 個々の上映イベントに対する座席オファー検索
 */
eventsRouter.get(
    '/screeningEvent/:id/offers',
    // permitScopes(['aws.cognito.signin.user.admin', 'events', 'events.read-only']),
    (_1, _2, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const eventAvailabilityRepo = new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient());
            const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
            const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
            const event = await eventRepo.findById({
                typeOf: chevre.factory.eventType.ScreeningEvent,
                id: req.params.id
            });
            const unavailableOffers = await eventAvailabilityRepo.findUnavailableOffersByEventId({ eventId: req.params.id });
            const movieTheater = await placeRepo.findMovieTheaterByBranchCode(event.superEvent.location.branchCode);
            const screeningRoom = <chevre.factory.place.movieTheater.IScreeningRoom>movieTheater.containsPlace.find(
                (p) => p.branchCode === event.location.branchCode
            );
            if (screeningRoom === undefined) {
                throw new chevre.factory.errors.NotFound('Screening room');
            }
            const screeningRoomSections = screeningRoom.containsPlace;
            const offers: chevre.factory.event.screeningEvent.IOffer[] = screeningRoomSections;
            offers.forEach((offer) => {
                const seats = offer.containsPlace;
                const seatSection = offer.branchCode;
                seats.forEach((seat) => {
                    const seatNumber = seat.branchCode;
                    const unavailableOffer = unavailableOffers.find(
                        (o) => o.seatSection === seatSection && o.seatNumber === seatNumber
                    );
                    seat.offers = [{
                        typeOf: 'Offer',
                        availability: (unavailableOffer !== undefined)
                            ? chevre.factory.itemAvailability.OutOfStock
                            : chevre.factory.itemAvailability.InStock
                    }];
                });
            });
            res.json(screeningRoomSections);
        } catch (error) {
            next(error);
        }
    }
);

export default eventsRouter;
