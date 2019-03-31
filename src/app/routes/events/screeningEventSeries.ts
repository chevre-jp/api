/**
 * 上映イベントシリーズルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body, query } from 'express-validator/check';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const screeningEventSeriesRouter = Router();

screeningEventSeriesRouter.post(
    '',
    permitScopes(['admin']),
    ...[
        body('typeOf')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
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
        body('name')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('eventStatus')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const eventAttributes: chevre.factory.event.screeningEventSeries.IAttributes = req.body;
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const event = await eventRepo.save({ attributes: eventAttributes });

            res.status(CREATED)
                .json(event);
        } catch (error) {
            next(error);
        }
    }
);

screeningEventSeriesRouter.get(
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
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const searchCoinditions: chevre.factory.event.screeningEventSeries.ISearchConditions = {
                ...req.query,
                typeOf: chevre.factory.eventType.ScreeningEventSeries,
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

screeningEventSeriesRouter.get(
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

screeningEventSeriesRouter.put(
    '/:id',
    permitScopes(['admin']),
    ...[
        body('typeOf')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
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
        body('name')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('eventStatus')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const eventAttributes: chevre.factory.event.screeningEventSeries.IAttributes = req.body;
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            await eventRepo.save({ id: req.params.id, attributes: eventAttributes });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default screeningEventSeriesRouter;
