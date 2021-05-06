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
 * 映画ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const moment = require("moment");
const mongoose = require("mongoose");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const movieRouter = express_1.Router();
movieRouter.post('', permitScopes_1.default([]), ...[
    express_validator_1.body('project')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('datePublished')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.body('datePublished')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.body('offers.availabilityStarts')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.body('offers.availabilityEnds')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.body('offers.validFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.body('offers.validThrough')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const creativeWorkRepo = new chevre.repository.CreativeWork(mongoose.connection);
        const project = Object.assign(Object.assign({}, req.body.project), { typeOf: chevre.factory.organizationType.Project });
        let movie = Object.assign(Object.assign(Object.assign({}, req.body), (typeof req.body.duration === 'string' && req.body.duration.lenght > 0)
            ? {
                duration: moment.duration(req.body.duration)
                    .toISOString()
            }
            : undefined), { id: '', project: project });
        movie = yield creativeWorkRepo.saveMovie(movie);
        res.status(http_status_1.CREATED)
            .json(movie);
    }
    catch (error) {
        next(error);
    }
}));
movieRouter.get('', permitScopes_1.default(['creativeWorks', 'creativeWorks.read-only']), ...[
    express_validator_1.query('datePublishedFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('datePublishedThrough')
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
        const creativeWorkRepo = new chevre.repository.CreativeWork(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const movies = yield creativeWorkRepo.searchMovies(searchConditions);
        res.json(movies);
    }
    catch (error) {
        next(error);
    }
}));
movieRouter.get('/:id', permitScopes_1.default(['creativeWorks', 'creativeWorks.read-only']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const creativeWorkRepo = new chevre.repository.CreativeWork(mongoose.connection);
        const movie = yield creativeWorkRepo.findMovieById({ id: req.params.id });
        res.json(movie);
    }
    catch (error) {
        next(error);
    }
}));
// tslint:disable-next-line:use-default-type-parameter
movieRouter.put('/:id', permitScopes_1.default([]), ...[
    express_validator_1.body('datePublished')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.body('datePublished')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.body('offers.availabilityStarts')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.body('offers.availabilityEnds')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.body('offers.validFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.body('offers.validThrough')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const creativeWorkRepo = new chevre.repository.CreativeWork(mongoose.connection);
        const movie = Object.assign(Object.assign(Object.assign({}, req.body), (typeof req.body.duration === 'string' && req.body.duration.lenght > 0)
            ? {
                duration: moment.duration(req.body.duration)
                    .toISOString()
            }
            : undefined), { id: req.params.id });
        yield creativeWorkRepo.saveMovie(movie);
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
movieRouter.delete('/:id', permitScopes_1.default([]), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const creativeWorkRepo = new chevre.repository.CreativeWork(mongoose.connection);
        yield creativeWorkRepo.deleteMovie({ id: req.params.id });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = movieRouter;
