/**
 * 上映イベントルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body } from 'express-validator/check';
import { CREATED } from 'http-status';
import * as mongoose from 'mongoose';

import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const screeningEventRouter = Router();

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
            const eventRepo = new chevre.repository.Event(mongoose.connection);
            const taskRepo = new chevre.repository.Task(mongoose.connection);

            const eventAttributes: chevre.factory.event.screeningEvent.IAttributes[] = req.body.attributes.map((a: any) => {
                const project: chevre.factory.project.IProject = (a.project !== undefined)
                    ? { ...a.project, typeOf: 'Project' }
                    : { id: <string>process.env.PROJECT_ID, typeOf: 'Project' };

                return {
                    ...a,
                    project: project
                };
            });

            const events = await eventRepo.createMany(eventAttributes);

            await Promise.all(events.map(async (event) => {
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
                await taskRepo.save(aggregateTask);
            }));

            res.status(CREATED)
                .json(events);
        } catch (error) {
            next(error);
        }
    }
);

export default screeningEventRouter;
