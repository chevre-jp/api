"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 上映イベントシリーズルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const screeningEventSeriesRouter = express_1.Router();
screeningEventSeriesRouter.post('', permitScopes_1.default(['admin']), ...[
    check_1.body('typeOf').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('startDate').not().isEmpty().withMessage((_, options) => `${options.path} is required`)
        .isISO8601().toDate(),
    check_1.body('endDate').not().isEmpty().withMessage((_, options) => `${options.path} is required`)
        .isISO8601().toDate(),
    check_1.body('workPerformed').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('location').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('name').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('eventStatus').not().isEmpty().withMessage((_, options) => `${options.path} is required`)
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventAttributes = req.body;
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        const event = yield eventRepo.saveScreeningEventSeries({ attributes: eventAttributes });
        res.status(http_status_1.CREATED).json(event);
    }
    catch (error) {
        next(error);
    }
}));
screeningEventSeriesRouter.get('', permitScopes_1.default(['admin', 'events', 'events.read-only']), ...[
    check_1.query('inSessionFrom').optional().isISO8601().toDate(),
    check_1.query('inSessionThrough').optional().isISO8601().toDate(),
    check_1.query('startFrom').optional().isISO8601().toDate(),
    check_1.query('startThrough').optional().isISO8601().toDate(),
    check_1.query('endFrom').optional().isISO8601().toDate(),
    check_1.query('endThrough').optional().isISO8601().toDate()
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        const searchCoinditions = Object.assign({}, req.query, { 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const events = yield eventRepo.searchScreeningEventSeries(searchCoinditions);
        const totalCount = yield eventRepo.countScreeningEventSeries(searchCoinditions);
        res.set('X-Total-Count', totalCount.toString());
        res.json(events);
    }
    catch (error) {
        next(error);
    }
}));
screeningEventSeriesRouter.get('/:id', permitScopes_1.default(['admin', 'events', 'events.read-only']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        const event = yield eventRepo.findById({
            id: req.params.id
        });
        res.json(event);
    }
    catch (error) {
        next(error);
    }
}));
screeningEventSeriesRouter.put('/:id', permitScopes_1.default(['admin']), ...[
    check_1.body('typeOf').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('startDate').not().isEmpty().withMessage((_, options) => `${options.path} is required`)
        .isISO8601().toDate(),
    check_1.body('endDate').not().isEmpty().withMessage((_, options) => `${options.path} is required`)
        .isISO8601().toDate(),
    check_1.body('workPerformed').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('location').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('name').not().isEmpty().withMessage((_, options) => `${options.path} is required`),
    check_1.body('eventStatus').not().isEmpty().withMessage((_, options) => `${options.path} is required`)
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventAttributes = req.body;
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        yield eventRepo.saveScreeningEventSeries({ id: req.params.id, attributes: eventAttributes });
        res.status(http_status_1.NO_CONTENT).end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = screeningEventSeriesRouter;
