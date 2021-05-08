/**
 * タスクルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, query } from 'express-validator';
import { CREATED } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const tasksRouter = Router();

/**
 * タスク作成
 */
// tslint:disable-next-line:use-default-type-parameter
tasksRouter.post<ParamsDictionary>(
    '/:name',
    permitScopes([]),
    ...[
        body('project')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('runsAt')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'required')
            .isISO8601(),
        body('remainingNumberOfTries')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'required')
            .isInt(),
        body('data')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const taskRepo = new chevre.repository.Task(mongoose.connection);

            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: chevre.factory.organizationType.Project };

            const attributes: chevre.factory.task.IAttributes<chevre.factory.taskName> = {
                project: project,
                name: <chevre.factory.taskName>req.params.name,
                status: chevre.factory.taskStatus.Ready,
                runsAt: moment(req.body.runsAt)
                    .toDate(),
                remainingNumberOfTries: Number(req.body.remainingNumberOfTries),
                numberOfTried: 0,
                executionResults: [],
                data: req.body.data
            };
            const task = await taskRepo.save(attributes);
            res.status(CREATED)
                .json(task);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * タスク確認
 */
tasksRouter.get(
    '/:name/:id',
    permitScopes([]),
    validator,
    async (req, res, next) => {
        try {
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            const task = await taskRepo.findById({
                name: <chevre.factory.taskName>req.params.name,
                id: req.params.id
            });
            res.json(task);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * タスク検索
 */
tasksRouter.get(
    '',
    permitScopes([]),
    ...[
        query('runsFrom')
            .optional()
            .isISO8601()
            .withMessage((_, options) => `${options.path} must be ISO8601 timestamp`)
            .toDate(),
        query('runsThrough')
            .optional()
            .isISO8601()
            .withMessage((_, options) => `${options.path} must be ISO8601 timestamp`)
            .toDate(),
        query('lastTriedFrom')
            .optional()
            .isISO8601()
            .withMessage((_, options) => `${options.path} must be ISO8601 timestamp`)
            .toDate(),
        query('lastTriedThrough')
            .optional()
            .isISO8601()
            .withMessage((_, options) => `${options.path} must be ISO8601 timestamp`)
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const taskRepo = new chevre.repository.Task(mongoose.connection);
            const searchConditions: chevre.factory.task.ISearchConditions<chevre.factory.taskName> = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const tasks = await taskRepo.search(searchConditions);

            res.json(tasks);
        } catch (error) {
            next(error);
        }
    }
);

export default tasksRouter;
