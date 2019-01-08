/**
 * イベントルーター
 */
import * as chevre from '@chevre/domain';
import { RequestHandler, Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body, oneOf, query } from 'express-validator/check';
import { CREATED, NO_CONTENT } from 'http-status';

import screeningEventRouter from './events/screeningEvent';
import screeningEventSeriesRouter from './events/screeningEventSeries';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

import * as redis from '../../redis';

const eventsRouter = Router();

eventsRouter.use(authentication);

eventsRouter.use('/screeningEvent', screeningEventRouter);
eventsRouter.use('/screeningEventSeries', screeningEventSeriesRouter);

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
    body().isArray().custom((value) => value.length <= MAX_NUM_EVENTS_CREATED).withMessage(() => 'Array length max exceeded'),
    body('*.typeOf').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    body('*.eventStatus').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    body('*.name').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    body('*.doorTime').optional().isISO8601().toDate(),
    body('*.startDate').not().isEmpty().withMessage((_, options) => `${options.path} is required`)
        .isISO8601().toDate(),
    body('*.endDate').not().isEmpty().withMessage((_, options) => `${options.path} is required`)
        .isISO8601().toDate(),
    body('*.workPerformed').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    body('*.location').not().isEmpty().withMessage((_, options) => `${options.path} is required`),

    oneOf([
        [
            body('*.typeOf').equals(chevre.factory.eventType.ScreeningEvent),
            body('*.superEvent').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
            body('*.offers').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
            body('*.offers.availabilityStarts').not().isEmpty().isISO8601().toDate(),
            body('*.offers.availabilityEnds').not().isEmpty().isISO8601().toDate(),
            body('*.offers.validFrom').not().isEmpty().isISO8601().toDate(),
            body('*.offers.validThrough').not().isEmpty().isISO8601().toDate()
        ],
        [
            body('*.typeOf').equals(chevre.factory.eventType.ScreeningEventSeries)
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
            const params = req.body;
            const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
            const events = await eventRepo.createMany(params);

            await Promise.all(events.map(async (event) => {
                if (event.typeOf === chevre.factory.eventType.ScreeningEvent) {
                    const aggregateTask: chevre.factory.task.aggregateScreeningEvent.IAttributes = {
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
                    await taskRepo.save(aggregateTask);
                }
            }));

            res.status(CREATED).json(events);
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
        query('typeOf').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
        query('inSessionFrom').optional().isISO8601().toDate(),
        query('inSessionThrough').optional().isISO8601().toDate(),
        query('startFrom').optional().isISO8601().toDate(),
        query('startThrough').optional().isISO8601().toDate(),
        query('endFrom').optional().isISO8601().toDate(),
        query('endThrough').optional().isISO8601().toDate(),
        query('offers.availableFrom').optional().isISO8601().toDate(),
        query('offers.availableThrough').optional().isISO8601().toDate(),
        query('offers.validFrom').optional().isISO8601().toDate(),
        query('offers.validThrough').optional().isISO8601().toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
            const searchCoinditions: chevre.factory.event.ISearchConditions<typeof req.query.typeOf> = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };
            const events = await eventRepo.search(searchCoinditions);
            const totalCount = await eventRepo.count(searchCoinditions);

            res.set('X-Total-Count', totalCount.toString());
            res.json(events);
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
            const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
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
            const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
            const event = await eventRepo.save({ id: req.params.id, attributes: eventAttributes });

            if (event.typeOf === chevre.factory.eventType.ScreeningEvent) {
                const aggregateTask: chevre.factory.task.aggregateScreeningEvent.IAttributes = {
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
                await taskRepo.save(aggregateTask);
            }

            res.status(NO_CONTENT).end();
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
            const eventAvailabilityRepo = new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient());
            const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
            const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
            const event = await eventRepo.findById<chevre.factory.eventType.ScreeningEvent>({
                id: req.params.id
            });
            const unavailableOffers = await eventAvailabilityRepo.findUnavailableOffersByEventId({ eventId: req.params.id });
            const movieTheater = await placeRepo.findMovieTheaterByBranchCode({ branchCode: event.superEvent.location.branchCode });
            const screeningRoom = <chevre.factory.place.movieTheater.IScreeningRoom>movieTheater.containsPlace.find(
                (p) => p.branchCode === event.location.branchCode
            );
            if (screeningRoom === undefined) {
                throw new chevre.factory.errors.NotFound('Screening room');
            }
            const screeningRoomSections = screeningRoom.containsPlace;
            const offers: chevre.factory.event.screeningEvent.IScreeningRoomSectionOffer[] = screeningRoomSections;
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
            res.json(screeningRoomSections);
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
            const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
            const priceSpecificationRepo = new chevre.repository.PriceSpecification(chevre.mongoose.connection);
            const ticketTypeRepo = new chevre.repository.TicketType(chevre.mongoose.connection);
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

export default eventsRouter;
