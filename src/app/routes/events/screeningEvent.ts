/**
 * 上映イベントルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body, query } from 'express-validator/check';
import { CREATED, NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

import * as redis from '../../../redis';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const screeningEventRouter = Router();

screeningEventRouter.post(
    '',
    permitScopes(['admin']),
    ...[
        body('typeOf')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('doorTime')
            .optional()
            .isISO8601()
            .toDate(),
        body('startDate')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required')
            .isISO8601()
            .toDate(),
        body('endDate')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required')
            .isISO8601()
            .toDate(),
        body('workPerformed')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('location')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('superEvent')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('name')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('eventStatus')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('offers')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('offers.availabilityStarts')
            .not()
            .isEmpty()
            .isISO8601()
            .toDate(),
        body('offers.availabilityEnds')
            .not()
            .isEmpty()
            .isISO8601()
            .toDate(),
        body('offers.validFrom')
            .not()
            .isEmpty()
            .isISO8601()
            .toDate(),
        body('offers.validThrough')
            .not()
            .isEmpty()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const eventAttributes: chevre.factory.event.screeningEvent.IAttributes = req.body;
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const event = await eventRepo.save({ attributes: eventAttributes });

            const aggregateTask: chevre.factory.task.aggregateScreeningEvent.IAttributes = {
                name: chevre.factory.taskName.AggregateScreeningEvent,
                status: chevre.factory.taskStatus.Ready,
                runsAt: new Date(),
                remainingNumberOfTries: 3,
                // tslint:disable-next-line:no-null-keyword
                lastTriedAt: null,
                numberOfTried: 0,
                executionResults: [],
                data: event
            };
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            await taskRepo.save(aggregateTask);

            res.status(CREATED)
                .json(event);
        } catch (error) {
            next(error);
        }
    }
);

screeningEventRouter.post(
    '/saveMultiple',
    permitScopes(['admin']),
    ...[
        body('attributes.*.typeOf')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('attributes.*.doorTime')
            .optional()
            .isISO8601()
            .toDate(),
        body('attributes.*.startDate')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required')
            .isISO8601()
            .toDate(),
        body('attributes.*.endDate')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required')
            .isISO8601()
            .toDate(),
        body('attributes.*.workPerformed')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('attributes.*.location')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('attributes.*.superEvent')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('attributes.*.name')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('attributes.*.eventStatus')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('attributes.*.offers')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('attributes.*.offers.availabilityStarts')
            .not()
            .isEmpty()
            .isISO8601()
            .toDate(),
        body('attributes.*.offers.availabilityEnds')
            .not()
            .isEmpty()
            .isISO8601()
            .toDate(),
        body('attributes.*.offers.validFrom')
            .not()
            .isEmpty()
            .isISO8601()
            .toDate(),
        body('attributes.*.offers.validThrough')
            .not()
            .isEmpty()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const eventAttributes: chevre.factory.event.screeningEvent.IAttributes[] = req.body.attributes;
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const events = await eventRepo.createMany(eventAttributes);

            const taskRepo = new chevre.repository.Task(mongoose.connection);
            await Promise.all(events.map(async (event) => {
                const aggregateTask: chevre.factory.task.aggregateScreeningEvent.IAttributes = {
                    name: chevre.factory.taskName.AggregateScreeningEvent,
                    status: chevre.factory.taskStatus.Ready,
                    runsAt: new Date(),
                    remainingNumberOfTries: 3,
                    // tslint:disable-next-line:no-null-keyword
                    lastTriedAt: null,
                    numberOfTried: 0,
                    executionResults: [],
                    data: event
                };
                await taskRepo.save(aggregateTask);
            }));

            res.status(CREATED)
                .json(events);
        } catch (error) {
            next(error);
        }
    }
);

screeningEventRouter.get(
    '',
    permitScopes(['admin', 'events', 'events.read-only']),
    ...[
        query('inSessionFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('inSessionThrough')
            .optional()
            .isISO8601()
            .toDate(),
        query('startFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('startThrough')
            .optional()
            .isISO8601()
            .toDate(),
        query('endFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('endThrough')
            .optional()
            .isISO8601()
            .toDate(),
        query('offers.availableFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('offers.availableThrough')
            .optional()
            .isISO8601()
            .toDate(),
        query('offers.validFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('offers.validThrough')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const searchCoinditions: chevre.factory.event.screeningEvent.ISearchConditions = {
                ...req.query,
                typeOf: chevre.factory.eventType.ScreeningEvent,
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const events = await eventRepo.search(searchCoinditions);
            const totalCount = await eventRepo.count(searchCoinditions);

            res.set('X-Total-Count', totalCount.toString())
                .json(events);
        } catch (error) {
            next(error);
        }
    }
);

screeningEventRouter.get(
    '/countTicketTypePerEvent',
    permitScopes(['admin']),
    (req, __, next) => {
        req.checkQuery('startFrom')
            .optional()
            .isISO8601()
            .withMessage('startFrom must be ISO8601 timestamp');
        req.checkQuery('startThrough')
            .optional()
            .isISO8601()
            .withMessage('startThrough must be ISO8601 timestamp');
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
            const events = await chevre.service.event.countTicketTypePerEvent({
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
                id: req.query.id,
                startFrom: (req.query.startFrom !== undefined) ? moment(req.query.startFrom)
                    .toDate() : undefined,
                startThrough: (req.query.startThrough !== undefined) ? moment(req.query.startThrough)
                    .toDate() : undefined
            })({
                reservation: reservationRepo
            });

            res.json(events);
        } catch (error) {
            next(error);
        }
    }
);

screeningEventRouter.get(
    '/:id',
    permitScopes(['admin', 'events', 'events.read-only']),
    validator,
    async (req, res, next) => {
        try {
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const event = await eventRepo.findById({
                id: req.params.id
            });

            res.json(event);
        } catch (error) {
            next(error);
        }
    }
);

screeningEventRouter.put(
    '/:id',
    permitScopes(['admin']),
    ...[
        body('typeOf')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('doorTime')
            .optional()
            .isISO8601()
            .toDate(),
        body('startDate')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required')
            .isISO8601()
            .toDate(),
        body('endDate')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required')
            .isISO8601()
            .toDate(),
        body('workPerformed')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('location')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('superEvent')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('name')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('eventStatus')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('offers')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('offers.availabilityStarts')
            .not()
            .isEmpty()
            .isISO8601()
            .toDate(),
        body('offers.availabilityEnds')
            .not()
            .isEmpty()
            .isISO8601()
            .toDate(),
        body('offers.validFrom')
            .not()
            .isEmpty()
            .isISO8601()
            .toDate(),
        body('offers.validThrough')
            .not()
            .isEmpty()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const eventAttributes: chevre.factory.event.screeningEvent.IAttributes = req.body;
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const event = await eventRepo.save({ id: req.params.id, attributes: eventAttributes });

            const aggregateTask: chevre.factory.task.aggregateScreeningEvent.IAttributes = {
                name: chevre.factory.taskName.AggregateScreeningEvent,
                status: chevre.factory.taskStatus.Ready,
                runsAt: new Date(),
                remainingNumberOfTries: 3,
                // tslint:disable-next-line:no-null-keyword
                lastTriedAt: null,
                numberOfTried: 0,
                executionResults: [],
                data: event
            };
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            await taskRepo.save(aggregateTask);

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 上映イベントに対する座席オファー検索
 */
screeningEventRouter.get(
    '/:id/offers',
    permitScopes(['admin', 'events', 'events.read-only']),
    validator,
    async (req, res, next) => {
        try {
            let offers: chevre.factory.event.screeningEvent.IScreeningRoomSectionOffer[] = [];

            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const event = await eventRepo.findById<chevre.factory.eventType.ScreeningEvent>({
                id: req.params.id
            });

            // 座席指定利用可能かどうか
            const reservedSeatsAvailable = !(
                event.offers !== undefined
                && event.offers.itemOffered !== undefined
                && event.offers.itemOffered.serviceOutput !== undefined
                && event.offers.itemOffered.serviceOutput.reservedTicket !== undefined
                && event.offers.itemOffered.serviceOutput.reservedTicket.ticketedSeat === undefined
            );

            if (reservedSeatsAvailable) {
                const eventAvailabilityRepo = new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient());
                const placeRepo = new chevre.repository.Place(mongoose.connection);
                const unavailableOffers = await eventAvailabilityRepo.findUnavailableOffersByEventId({ eventId: req.params.id });
                const movieTheater = await placeRepo.findMovieTheaterByBranchCode({ branchCode: event.superEvent.location.branchCode });
                const screeningRoom = <chevre.factory.place.movieTheater.IScreeningRoom>movieTheater.containsPlace.find(
                    (p) => p.branchCode === event.location.branchCode
                );
                if (screeningRoom === undefined) {
                    throw new chevre.factory.errors.NotFound('Screening Room');
                }

                offers = screeningRoom.containsPlace;
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
                            priceCurrency: chevre.factory.priceCurrency.JPY,
                            availability: (unavailableOffer !== undefined)
                                ? chevre.factory.itemAvailability.OutOfStock
                                : chevre.factory.itemAvailability.InStock
                        }];
                    });
                });
            }

            res.json(offers);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 上映イベントに対するチケットオファー検索
 */
screeningEventRouter.get(
    '/:id/offers/ticket',
    permitScopes(['admin', 'events', 'events.read-only']),
    validator,
    async (req, res, next) => {
        try {
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
            const ticketTypeRepo = new chevre.repository.TicketType(mongoose.connection);

            const offers = await chevre.service.offer.searchScreeningEventTicketOffers({ eventId: req.params.id })({
                event: eventRepo,
                priceSpecification: priceSpecificationRepo,
                ticketType: ticketTypeRepo
            });

            res.json(offers);
        } catch (error) {
            next(error);
        }
    }
);

export default screeningEventRouter;
