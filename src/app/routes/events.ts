/**
 * イベントルーター
 */
import * as chevre from '@chevre/domain';
import { RequestHandler, Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, oneOf, query } from 'express-validator';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import screeningEventRouter from './events/screeningEvent';

import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

import * as redis from '../../redis';

const eventsRouter = Router();

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
    permitScopes(['events.*']),
    ...validations,
    validator,
    async (req, res, next) => {
        try {
            const params = req.body.map((a: any) => {
                const project: chevre.factory.project.IProject = { id: req.project.id, typeOf: chevre.factory.organizationType.Project };

                return {
                    ...a,
                    project: project
                };
            });

            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);

            const events = await eventRepo.createMany(params);

            await Promise.all(events.map(async (event) => {
                await chevre.service.offer.onEventChanged(event)({
                    event: eventRepo,
                    project: projectRepo,
                    task: taskRepo
                });
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
    permitScopes(['events.*', 'events', 'events.read']),
    ...[
        query('$projection.*')
            .toInt(),
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
            const countDocuments = req.query.countDocuments === '1';

            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const searchConditions: chevre.factory.event.ISearchConditions<typeof req.query.typeOf> = {
                ...req.query,
                project: { id: { $eq: req.project.id } },
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            // projectionの指定があれば適用する
            const projection: any = (req.query.$projection !== undefined && req.query.$projection !== null)
                ? { ...req.query.$projection }
                : {
                    aggregateEntranceGate: 0,
                    aggregateOffer: 0,
                    // 古いデータについて不要な情報が含まれていたため対処
                    'offers.project.settings': 0
                };

            const events = await eventRepo.search(
                searchConditions,
                projection
            );

            if (process.env.USE_EVENTS_X_TOTAL_COUNTS === '1' || countDocuments) {
                const totalCount = await eventRepo.count(searchConditions);
                res.set('X-Total-Count', totalCount.toString());
            }

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
    permitScopes(['events.*', 'events', 'events.read']),
    validator,
    async (req, res, next) => {
        try {
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const event = await eventRepo.findById(
                {
                    id: req.params.id
                },
                {
                    // 古いデータについて不要な情報が含まれていたため対処
                    'offers.project.settings': 0
                }
            );

            res.json(event);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * イベント部分更新
 */
// tslint:disable-next-line:use-default-type-parameter
eventsRouter.patch<ParamsDictionary>(
    '/:id',
    permitScopes(['events.*']),
    ...[
        body('onUpdated.sendEmailMessage')
            .optional()
            .isArray({ max: 50 })
    ],
    validator,
    async (req, res, next) => {
        try {
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);

            const event = await eventRepo.save<chevre.factory.eventType>({
                id: req.params.id,
                // attributes: req.body,
                attributes: <any>{
                    typeOf: req.body.typeOf,
                    // とりあえず限定された属性のみ更新を許可
                    ...(typeof req.body.eventStatus === 'string' && req.body.eventStatus.length > 0)
                        ? { eventStatus: req.body.eventStatus }
                        : undefined
                },
                upsert: false
            });

            await chevre.service.offer.onEventChanged(event)({
                event: eventRepo,
                project: projectRepo,
                task: taskRepo
            });

            // onUpdatedオプションを実装
            const sendEmailMessage: chevre.factory.action.transfer.send.message.email.IAttributes[]
                = req.body.onUpdated?.sendEmailMessage;
            if (Array.isArray(sendEmailMessage) && sendEmailMessage.length > 0) {
                const runsAt = new Date();
                const taskAttributes: chevre.factory.task.IAttributes<chevre.factory.taskName.SendEmailMessage>[]
                    = sendEmailMessage.map((s) => {
                        return {
                            project: { typeOf: req.project.typeOf, id: req.project.id },
                            name: chevre.factory.taskName.SendEmailMessage,
                            status: chevre.factory.taskStatus.Ready,
                            runsAt: runsAt,
                            remainingNumberOfTries: 3,
                            numberOfTried: 0,
                            executionResults: [],
                            data: {
                                actionAttributes: {
                                    ...s,
                                    agent: req.agent,
                                    typeOf: chevre.factory.actionType.SendAction
                                }
                            }
                        };
                    });

                await taskRepo.saveMany(taskAttributes);
            }

            res.status(NO_CONTENT)
                .end();
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
    permitScopes(['events.*']),
    ...validations,
    validator,
    async (req, res, next) => {
        try {
            const eventAttributes: chevre.factory.event.IAttributes<chevre.factory.eventType> = req.body[0];
            const upsert = req.query.upsert === 'true';

            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);

            const event = await eventRepo.save<chevre.factory.eventType>({
                id: req.params.id,
                attributes: eventAttributes,
                upsert: upsert
            });

            await chevre.service.offer.onEventChanged(event)({
                event: eventRepo,
                project: projectRepo,
                task: taskRepo
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

eventsRouter.delete(
    '/:id',
    permitScopes(['events.*']),
    validator,
    async (req, res, next) => {
        try {
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            await eventRepo.eventModel.findOneAndDelete(
                { _id: req.params.id }
            )
                .exec();

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 座席オファー検索
 * 非推奨なので廃止
 */
// eventsRouter.get(
//     '/:id/offers',
//     permitScopes(['events', 'events.read-only']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const offers = await chevre.service.offer.searchEventSeatOffers({
//                 event: { id: req.params.id }
//             })({
//                 event: new chevre.repository.Event(mongoose.connection),
//                 priceSpecification: new chevre.repository.PriceSpecification(mongoose.connection),
//                 eventAvailability: new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient()),
//                 place: new chevre.repository.Place(mongoose.connection)
//             });

//             res.json(offers);
//         } catch (error) {
//             next(error);
//         }
//     }
// );

/**
 * イベントオファー検索
 */
eventsRouter.get(
    '/:id/offers/ticket',
    permitScopes(['events.*', 'events', 'events.read']),
    validator,
    async (req, res, next) => {
        try {
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
            const offerRateLimitRepo = new chevre.repository.rateLimit.Offer(redis.getClient());
            const productRepo = new chevre.repository.Product(mongoose.connection);

            const offers = await chevre.service.offer.searchScreeningEventTicketOffers({ eventId: req.params.id })({
                event: eventRepo,
                offer: offerRepo,
                offerCatalog: offerCatalogRepo,
                offerRateLimit: offerRateLimitRepo,
                priceSpecification: priceSpecificationRepo,
                product: productRepo
            });

            res.json(offers);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 座席検索
 */
// tslint:disable-next-line:use-default-type-parameter
eventsRouter.get<ParamsDictionary>(
    '/:id/seats',
    permitScopes(['events.*', 'events', 'events.read']),
    ...[
        query('$projection.*')
            .toInt(),
        query('limit')
            .optional()
            .isInt()
            .toInt(),
        query('page')
            .optional()
            .isInt()
            .toInt()
    ],
    validator,
    async (req, res, next) => {
        try {
            const searchConditions: any = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const offers = await chevre.service.offer.searchEventSeatOffersWithPaging({
                ...searchConditions,
                event: { id: req.params.id }
            })({
                event: new chevre.repository.Event(mongoose.connection),
                priceSpecification: new chevre.repository.PriceSpecification(mongoose.connection),
                eventAvailability: new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient()),
                place: new chevre.repository.Place(mongoose.connection)
            });

            res.json(offers);
        } catch (error) {
            next(error);
        }
    }
);

export default eventsRouter;
