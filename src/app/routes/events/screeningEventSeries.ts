/**
 * 上映イベントシリーズルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { CREATED, NO_CONTENT } from 'http-status';
import * as moment from 'moment';

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const screeningEventSeriesRouter = Router();
screeningEventSeriesRouter.use(authentication);
screeningEventSeriesRouter.post(
    '',
    permitScopes(['admin']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const eventAttributes: chevre.factory.event.screeningEventSeries.IAttributes = {
                typeOf: chevre.factory.eventType.ScreeningEventSeries,
                name: req.body.name,
                kanaName: req.body.kanaName,
                alternativeHeadline: req.body.alternativeHeadline,
                location: req.body.location,
                videoFormat: req.body.videoFormat,
                subtitleLanguage: req.body.subtitleLanguage,
                workPerformed: req.body.workPerformed,
                duration: (req.body.duration !== undefined) ? moment.duration(req.body.duration).toISOString() : undefined,
                startDate: (req.body.startDate !== undefined) ? moment(req.body.startDate).toDate() : undefined,
                endDate: (req.body.endDate !== undefined) ? moment(req.body.endDate).toDate() : undefined,
                eventStatus: req.body.eventStatus
            };
            const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
            const event = await eventRepo.saveScreeningEventSeries({ attributes: eventAttributes });
            res.status(CREATED).json(event);
        } catch (error) {
            next(error);
        }
    }
);
screeningEventSeriesRouter.get(
    '',
    permitScopes(['admin', 'events', 'events.read-only']),
    (req, __, next) => {
        req.checkQuery('inSessionFrom').optional().isISO8601().withMessage('inSessionFrom must be ISO8601 timestamp');
        req.checkQuery('inSessionThrough').optional().isISO8601().withMessage('inSessionThrough must be ISO8601 timestamp');
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
            const searchCoinditions: chevre.factory.event.screeningEventSeries.ISearchConditions = {
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
            const events = await eventRepo.searchScreeningEventSeries(searchCoinditions);
            const totalCount = await eventRepo.countScreeningEventSeries(searchCoinditions);
            res.set('X-Total-Count', totalCount.toString());
            res.json(events);
        } catch (error) {
            next(error);
        }
    }
);
screeningEventSeriesRouter.get(
    '/:id',
    permitScopes(['admin', 'events', 'events.read-only']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
            const event = await eventRepo.findById({
                typeOf: chevre.factory.eventType.ScreeningEventSeries,
                id: req.params.id
            });
            res.json(event);
        } catch (error) {
            next(error);
        }
    }
);
screeningEventSeriesRouter.put(
    '/:id',
    permitScopes(['admin']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const eventAttributes: chevre.factory.event.screeningEventSeries.IAttributes = {
                typeOf: chevre.factory.eventType.ScreeningEventSeries,
                name: req.body.name,
                kanaName: req.body.kanaName,
                alternativeHeadline: req.body.alternativeHeadline,
                location: req.body.location,
                videoFormat: req.body.videoFormat,
                subtitleLanguage: req.body.subtitleLanguage,
                workPerformed: req.body.workPerformed,
                duration: (req.body.duration !== undefined) ? moment.duration(req.body.duration).toISOString() : undefined,
                startDate: (req.body.startDate !== undefined) ? moment(req.body.startDate).toDate() : undefined,
                endDate: (req.body.endDate !== undefined) ? moment(req.body.endDate).toDate() : undefined,
                eventStatus: req.body.eventStatus
            };
            const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
            await eventRepo.saveScreeningEventSeries({ id: req.params.id, attributes: eventAttributes });
            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);
screeningEventSeriesRouter.delete(
    '/:id',
    permitScopes(['admin']),
    (_, __, next) => {
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const eventRepo = new chevre.repository.Event(chevre.mongoose.connection);
            await eventRepo.deleteById({
                typeOf: chevre.factory.eventType.ScreeningEventSeries,
                id: req.params.id
            });
            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);
export default screeningEventSeriesRouter;
