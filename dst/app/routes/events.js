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
 * イベントルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const screeningEvent_1 = require("./events/screeningEvent");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const redis = require("../../redis");
const eventsRouter = express_1.Router();
eventsRouter.use('/screeningEvent', screeningEvent_1.default);
const MAX_NUM_EVENTS_CREATED = 200;
/**
 * イベントに対するバリデーション
 */
const validations = [
    (req, _, next) => {
        // 単一リソース、複数リソースの両方に対応するため、bodyがオブジェクトの場合配列に変換
        req.body = (Array.isArray(req.body)) ? req.body : [req.body];
        next();
    },
    express_validator_1.body()
        .isArray()
        .custom((value) => value.length <= MAX_NUM_EVENTS_CREATED)
        .withMessage(() => 'Array length max exceeded'),
    express_validator_1.body('*.project')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('*.typeOf')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('*.eventStatus')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('*.name')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('*.doorTime')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.body('*.startDate')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
        .isISO8601()
        .toDate(),
    express_validator_1.body('*.endDate')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
        .isISO8601()
        .toDate(),
    express_validator_1.body('*.workPerformed')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('*.location')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.oneOf([
        [
            express_validator_1.body('*.typeOf')
                .equals(chevre.factory.eventType.ScreeningEvent),
            express_validator_1.body('*.superEvent')
                .not()
                .isEmpty()
                .withMessage((_, __) => 'Required'),
            express_validator_1.body('*.offers')
                .not()
                .isEmpty()
                .withMessage((_, __) => 'Required'),
            express_validator_1.body('*.offers.availabilityStarts')
                .not()
                .isEmpty()
                .isISO8601()
                .toDate(),
            express_validator_1.body('*.offers.availabilityEnds')
                .not()
                .isEmpty()
                .isISO8601()
                .toDate(),
            express_validator_1.body('*.offers.validFrom')
                .not()
                .isEmpty()
                .isISO8601()
                .toDate(),
            express_validator_1.body('*.offers.validThrough')
                .not()
                .isEmpty()
                .isISO8601()
                .toDate()
        ],
        [
            express_validator_1.body('*.typeOf')
                .equals(chevre.factory.eventType.ScreeningEventSeries)
        ]
    ])
];
/**
 * イベント作成
 */
eventsRouter.post('', permitScopes_1.default(['events.*']), ...validations, validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const params = req.body.map((a) => {
            const project = { id: req.project.id, typeOf: chevre.factory.organizationType.Project };
            return Object.assign(Object.assign({}, a), { project: project });
        });
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const events = yield eventRepo.createMany(params);
        yield Promise.all(events.map((event) => __awaiter(void 0, void 0, void 0, function* () {
            yield chevre.service.offer.onEventChanged(event)({
                event: eventRepo,
                project: projectRepo,
                task: taskRepo
            });
        })));
        res.status(http_status_1.CREATED)
            .json(events);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * イベント検索
 */
eventsRouter.get('', permitScopes_1.default(['events.*', 'events', 'events.read']), ...[
    express_validator_1.query('$projection.*')
        .toInt(),
    express_validator_1.query('typeOf')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.query('inSessionFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('inSessionThrough')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('startFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('startThrough')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('endFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('endThrough')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('offers.availableFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('offers.availableThrough')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('offers.validFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('offers.validThrough')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const countDocuments = req.query.countDocuments === '1';
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { project: { id: { $eq: req.project.id } }, 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        // projectionの指定があれば適用する
        const projection = (req.query.$projection !== undefined && req.query.$projection !== null)
            ? Object.assign({}, req.query.$projection) : {
            aggregateEntranceGate: 0,
            aggregateOffer: 0,
            // 古いデータについて不要な情報が含まれていたため対処
            'offers.project.settings': 0
        };
        const events = yield eventRepo.search(searchConditions, projection);
        if (process.env.USE_EVENTS_X_TOTAL_COUNTS === '1' || countDocuments) {
            const totalCount = yield eventRepo.count(searchConditions);
            res.set('X-Total-Count', totalCount.toString());
        }
        res.json(events);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * IDでイベント検索
 */
eventsRouter.get('/:id', permitScopes_1.default(['events.*', 'events', 'events.read']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        const event = yield eventRepo.findById({
            id: req.params.id
        }, {
            // 古いデータについて不要な情報が含まれていたため対処
            'offers.project.settings': 0
        });
        res.json(event);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * イベント部分更新
 */
// tslint:disable-next-line:use-default-type-parameter
eventsRouter.patch('/:id', permitScopes_1.default(['events.*']), ...[
    express_validator_1.body('onUpdated.sendEmailMessage')
        .optional()
        .isArray({ max: 50 })
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const event = yield eventRepo.save({
            id: req.params.id,
            // attributes: req.body,
            attributes: Object.assign({ typeOf: req.body.typeOf }, (typeof req.body.eventStatus === 'string' && req.body.eventStatus.length > 0)
                ? { eventStatus: req.body.eventStatus }
                : undefined),
            upsert: false
        });
        yield chevre.service.offer.onEventChanged(event)({
            event: eventRepo,
            project: projectRepo,
            task: taskRepo
        });
        // onUpdatedオプションを実装
        const sendEmailMessage = (_a = req.body.onUpdated) === null || _a === void 0 ? void 0 : _a.sendEmailMessage;
        if (Array.isArray(sendEmailMessage) && sendEmailMessage.length > 0) {
            const runsAt = new Date();
            const taskAttributes = sendEmailMessage.map((s) => {
                return {
                    project: { typeOf: req.project.typeOf, id: req.project.id },
                    name: chevre.factory.taskName.SendEmailMessage,
                    status: chevre.factory.taskStatus.Ready,
                    runsAt: runsAt,
                    remainingNumberOfTries: 3,
                    numberOfTried: 0,
                    executionResults: [],
                    data: {
                        actionAttributes: Object.assign(Object.assign({}, s), { agent: req.agent, typeOf: chevre.factory.actionType.SendAction })
                    }
                };
            });
            yield taskRepo.saveMany(taskAttributes);
        }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
/**
 * イベント更新
 */
eventsRouter.put('/:id', permitScopes_1.default(['events.*']), ...validations, validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventAttributes = req.body[0];
        const upsert = req.query.upsert === 'true';
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const event = yield eventRepo.save({
            id: req.params.id,
            attributes: eventAttributes,
            upsert: upsert
        });
        yield chevre.service.offer.onEventChanged(event)({
            event: eventRepo,
            project: projectRepo,
            task: taskRepo
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
eventsRouter.delete('/:id', permitScopes_1.default(['events.*']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        yield eventRepo.eventModel.findOneAndDelete({ _id: req.params.id })
            .exec();
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
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
eventsRouter.get('/:id/offers/ticket', permitScopes_1.default(['events.*', 'events', 'events.read']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        const priceSpecificationRepo = new chevre.repository.PriceSpecification(mongoose.connection);
        const offerRepo = new chevre.repository.Offer(mongoose.connection);
        const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
        const offerRateLimitRepo = new chevre.repository.rateLimit.Offer(redis.getClient());
        const productRepo = new chevre.repository.Product(mongoose.connection);
        const offers = yield chevre.service.offer.searchScreeningEventTicketOffers({ eventId: req.params.id })({
            event: eventRepo,
            offer: offerRepo,
            offerCatalog: offerCatalogRepo,
            offerRateLimit: offerRateLimitRepo,
            priceSpecification: priceSpecificationRepo,
            product: productRepo
        });
        res.json(offers);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 座席検索
 */
// tslint:disable-next-line:use-default-type-parameter
eventsRouter.get('/:id/seats', permitScopes_1.default(['events.*', 'events', 'events.read']), ...[
    express_validator_1.query('$projection.*')
        .toInt(),
    express_validator_1.query('limit')
        .optional()
        .isInt()
        .toInt(),
    express_validator_1.query('page')
        .optional()
        .isInt()
        .toInt()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const offers = yield chevre.service.offer.searchEventSeatOffersWithPaging(Object.assign(Object.assign({}, searchConditions), { event: { id: req.params.id } }))({
            event: new chevre.repository.Event(mongoose.connection),
            priceSpecification: new chevre.repository.PriceSpecification(mongoose.connection),
            eventAvailability: new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient()),
            place: new chevre.repository.Place(mongoose.connection)
        });
        res.json(offers);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = eventsRouter;
