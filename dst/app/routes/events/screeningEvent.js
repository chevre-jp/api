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
 * 上映イベントルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const screeningEventRouter = express_1.Router();
screeningEventRouter.post('/saveMultiple', permitScopes_1.default(['admin']), ...[
    express_validator_1.body('attributes.*.project')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('attributes.*.typeOf')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('attributes.*.doorTime')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.body('attributes.*.startDate')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
        .isISO8601()
        .toDate(),
    express_validator_1.body('attributes.*.endDate')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
        .isISO8601()
        .toDate(),
    express_validator_1.body('attributes.*.workPerformed')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('attributes.*.location')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('attributes.*.superEvent')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('attributes.*.name')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('attributes.*.eventStatus')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('attributes.*.offers')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('attributes.*.offers.availabilityStarts')
        .not()
        .isEmpty()
        .isISO8601()
        .toDate(),
    express_validator_1.body('attributes.*.offers.availabilityEnds')
        .not()
        .isEmpty()
        .isISO8601()
        .toDate(),
    express_validator_1.body('attributes.*.offers.validFrom')
        .not()
        .isEmpty()
        .isISO8601()
        .toDate(),
    express_validator_1.body('attributes.*.offers.validThrough')
        .not()
        .isEmpty()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const eventAttributes = req.body.attributes.map((a) => {
            const project = Object.assign(Object.assign({}, a.project), { typeOf: chevre.factory.organizationType.Project });
            return Object.assign(Object.assign({}, a), { project: project });
        });
        const events = yield eventRepo.createMany(eventAttributes);
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
exports.default = screeningEventRouter;
