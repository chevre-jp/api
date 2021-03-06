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
 * タスクルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const moment = require("moment");
const mongoose = require("mongoose");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const tasksRouter = express_1.Router();
/**
 * タスク作成
 */
// tslint:disable-next-line:use-default-type-parameter
tasksRouter.post('/:name', permitScopes_1.default(['tasks.*', 'tasks.create']), ...[
    express_validator_1.body('project')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('runsAt')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'required')
        .isISO8601(),
    express_validator_1.body('remainingNumberOfTries')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'required')
        .isInt(),
    express_validator_1.body('data')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const project = { id: req.project.id, typeOf: chevre.factory.organizationType.Project };
        const attributes = {
            project: project,
            name: req.params.name,
            status: chevre.factory.taskStatus.Ready,
            runsAt: moment(req.body.runsAt)
                .toDate(),
            remainingNumberOfTries: Number(req.body.remainingNumberOfTries),
            numberOfTried: 0,
            executionResults: [],
            data: req.body.data
        };
        const task = yield taskRepo.save(attributes);
        res.status(http_status_1.CREATED)
            .json(task);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * タスク確認
 */
tasksRouter.get('/:name/:id', permitScopes_1.default(['tasks.*', 'tasks.read']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const task = yield taskRepo.findById({
            name: req.params.name,
            id: req.params.id
        });
        res.json(task);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * タスク検索
 */
tasksRouter.get('', permitScopes_1.default(['tasks.*', 'tasks.read']), ...[
    express_validator_1.query('runsFrom')
        .optional()
        .isISO8601()
        .withMessage((_, options) => `${options.path} must be ISO8601 timestamp`)
        .toDate(),
    express_validator_1.query('runsThrough')
        .optional()
        .isISO8601()
        .withMessage((_, options) => `${options.path} must be ISO8601 timestamp`)
        .toDate(),
    express_validator_1.query('lastTriedFrom')
        .optional()
        .isISO8601()
        .withMessage((_, options) => `${options.path} must be ISO8601 timestamp`)
        .toDate(),
    express_validator_1.query('lastTriedThrough')
        .optional()
        .isISO8601()
        .withMessage((_, options) => `${options.path} must be ISO8601 timestamp`)
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { project: { id: { $eq: req.project.id } }, 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const tasks = yield taskRepo.search(searchConditions);
        res.json(tasks);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = tasksRouter;
