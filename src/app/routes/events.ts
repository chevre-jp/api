/**
 * イベントルーター
 */
import * as chevre from '@chevre/domain';
import { RequestHandler, Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body, oneOf, query } from 'express-validator/check';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import screeningEventRouter from './events/screeningEvent';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

import * as redis from '../../redis';

const eventsRouter = Router();

eventsRouter.use(authentication);

eventsRouter.use('/screeningEvent', screeningEventRouter);

const MAX_NUM_EVENTS_CREATED = 200;

/**
 * イベントに対するバリデーション
 */
const validations: RequestHandler[] = [
    (req, _, next) => {
        // 単一リソース、複数リソースの両方に対応するため、bodyがオブジェクトの場合配列に変換
        req.body = (Array.isArray(req.body)) ? req.body : [req.body];
        next();
    },
    body()
        .isArray()
        .custom((value) => value.length <= MAX_NUM_EVENTS_CREATED)
        .withMessage(() => 'Array length max exceeded'),
    body('*.project')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    body('*.typeOf')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    body('*.eventStatus')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    body('*.name')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    body('*.doorTime')
        .optional()
        .isISO8601()
        .toDate(),
    body('*.startDate')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
        .isISO8601()
        .toDate(),
    body('*.endDate')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
        .isISO8601()
        .toDate(),
    body('*.workPerformed')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    body('*.location')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),

    oneOf([
        [
            body('*.typeOf')
                .equals(chevre.factory.eventType.ScreeningEvent),
            body('*.superEvent')
                .not()
                .isEmpty()
                .withMessage((_, __) => 'Required'),
            body('*.offers')
                .not()
                .isEmpty()
                .withMessage((_, __) => 'Required'),
            body('*.offers.availabilityStarts')
                .not()
                .isEmpty()
                .isISO8601()
                .toDate(),
            body('*.offers.availabilityEnds')
                .not()
                .isEmpty()
                .isISO8601()
                .toDate(),
            body('*.offers.validFrom')
                .not()
                .isEmpty()
                .isISO8601()
                .toDate(),
            body('*.offers.validThrough')
                .not()
                .isEmpty()
                .isISO8601()
                .toDate()
        ],
        [
            body('*.typeOf')
                .equals(chevre.factory.eventType.ScreeningEventSeries)
        ]
    ])
];

/**
 * イベント作成
 */
eventsRouter.post(
    '',
    permitScopes(['admin']),
    ...validations,
    validator,
    async (req, res, next) => {
        try {
            const params = req.body.map((a: any) => {
                const project: chevre.factory.project.IProject = { ...a.project, typeOf: 'Project' };

                return {
                    ...a,
                    project: project
                };
            });

            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const events = await eventRepo.createMany(params);

            await Promise.all(events.map(async (event) => {
                if (event.typeOf === chevre.factory.eventType.ScreeningEvent) {
                    const aggregateTask: chevre.factory.task.aggregateScreeningEvent.IAttributes = {
                        project: event.project,
                        name: chevre.factory.taskName.AggregateScreeningEvent,
                        status: chevre.factory.taskStatus.Ready,
                        runsAt: new Date(),
                        remainingNumberOfTries: 3,
                        numberOfTried: 0,
                        executionResults: [],
                        data: event
                    };
                    const taskRepo = new chevre.repository.Task(mongoose.connection);
                    await taskRepo.save(aggregateTask);
                }
            }));

            res.status(CREATED)
                .json(events);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * イベント検索
 */
eventsRouter.get(
    '',
    permitScopes(['admin', 'events', 'events.read-only']),
    ...[
        query('typeOf')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
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
            const searchCoinditions: chevre.factory.event.ISearchConditions<typeof req.query.typeOf> = {
                ...req.query,
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

eventsRouter.get(
    '/withAggregateReservation',
    permitScopes(['admin']),
    ...[
        query('typeOf')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
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
            const reservationRepo = new chevre.repository.Reservation(mongoose.connection);

            // イベント検索
            const searchCoinditions: chevre.factory.event.screeningEvent.ISearchConditions = {
                ...req.query,
                typeOf: chevre.factory.eventType.ScreeningEvent,
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const events = await eventRepo.search(searchCoinditions);
            const totalCount = await eventRepo.count(searchCoinditions);

            const eventsWithAggregation = await Promise.all(events.map(async (e) => {
                const aggregation = await chevre.service.aggregation.aggregateEventReservation({
                    id: e.id
                })({
                    reservation: reservationRepo
                });

                return {
                    ...e,
                    ...aggregation,
                    preSaleTicketCount: aggregation.advanceTicketCount
                };
            }));

            res.set('X-Total-Count', totalCount.toString())
                .json(eventsWithAggregation);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * IDでイベント検索
 */
eventsRouter.get(
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

/**
 * イベント更新
 */
eventsRouter.put(
    '/:id',
    permitScopes(['admin']),
    ...validations,
    validator,
    async (req, res, next) => {
        try {
            const eventAttributes: chevre.factory.event.IAttributes<typeof req.body.typeOf> = req.body[0];
            const upsert = req.query.upsert === 'true';

            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const event = await eventRepo.save({
                id: req.params.id,
                attributes: eventAttributes,
                upsert: upsert
            });

            if (event.typeOf === chevre.factory.eventType.ScreeningEvent) {
                const aggregateTask: chevre.factory.task.aggregateScreeningEvent.IAttributes = {
                    project: event.project,
                    name: chevre.factory.taskName.AggregateScreeningEvent,
                    status: chevre.factory.taskStatus.Ready,
                    runsAt: new Date(),
                    remainingNumberOfTries: 3,
                    numberOfTried: 0,
                    executionResults: [],
                    data: <chevre.factory.event.IEvent<chevre.factory.eventType.ScreeningEvent>>event
                };
                const taskRepo = new chevre.repository.Task(mongoose.connection);
                await taskRepo.save(aggregateTask);
            }

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

/**
 * イベントに対する座席オファー検索
 */
eventsRouter.get(
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
                const movieTheater = await placeRepo.findById({ id: event.superEvent.location.id });
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
 * イベントに対するチケットオファー検索
 */
eventsRouter.get(
    '/:id/offers/ticket',
    permitScopes(['admin', 'events', 'events.read-only']),
    validator,
    async (req, res, next) => {
        try {
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const offers = await chevre.service.offer.searchScreeningEventTicketOffers({ eventId: req.params.id })({
                event: eventRepo,
                offer: offerRepo,
                priceSpecification: priceSpecificationRepo
            });

            res.json(offers);
        } catch (error) {
            next(error);
        }
    }
);

export default eventsRouter;
