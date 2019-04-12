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
 * 上映イベントルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const screeningEventRouter = express_1.Router();
screeningEventRouter.post('/saveMultiple', permitScopes_1.default(['admin']), ...[
    check_1.body('attributes.*.typeOf')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('attributes.*.doorTime')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.body('attributes.*.startDate')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
        .isISO8601()
        .toDate(),
    check_1.body('attributes.*.endDate')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
        .isISO8601()
        .toDate(),
    check_1.body('attributes.*.workPerformed')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('attributes.*.location')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('attributes.*.superEvent')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('attributes.*.name')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('attributes.*.eventStatus')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('attributes.*.offers')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    check_1.body('attributes.*.offers.availabilityStarts')
        .not()
        .isEmpty()
        .isISO8601()
        .toDate(),
    check_1.body('attributes.*.offers.availabilityEnds')
        .not()
        .isEmpty()
        .isISO8601()
        .toDate(),
    check_1.body('attributes.*.offers.validFrom')
        .not()
        .isEmpty()
        .isISO8601()
        .toDate(),
    check_1.body('attributes.*.offers.validThrough')
        .not()
        .isEmpty()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const eventAttributes = req.body.attributes;
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        const events = yield eventRepo.createMany(eventAttributes);
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        yield Promise.all(events.map((event) => __awaiter(this, void 0, void 0, function* () {
            const aggregateTask = {
                name: chevre.factory.taskName.AggregateScreeningEvent,
                status: chevre.factory.taskStatus.Ready,
                runsAt: new Date(),
                remainingNumberOfTries: 3,
                numberOfTried: 0,
                executionResults: [],
                data: event
            };
            yield taskRepo.save(aggregateTask);
        })));
        res.status(http_status_1.CREATED)
            .json(events);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = screeningEventRouter;
