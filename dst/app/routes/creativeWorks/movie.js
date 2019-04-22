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
 * 映画ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
// tslint:disable-next-line:no-submodule-imports
const check_1 = require("express-validator/check");
const http_status_1 = require("http-status");
const moment = require("moment");
const mongoose = require("mongoose");
const authentication_1 = require("../../middlewares/authentication");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const movieRouter = express_1.Router();
movieRouter.use(authentication_1.default);
movieRouter.post('', permitScopes_1.default(['admin']), ...[
    check_1.body('datePublished')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.body('datePublished')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.body('offers.availabilityStarts')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.body('offers.availabilityEnds')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.body('offers.validFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.body('offers.validThrough')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const creativeWorkRepo = new chevre.repository.CreativeWork(mongoose.connection);
        const project = (req.body.project !== undefined)
            ? Object.assign({}, req.body.project, { typeOf: 'Project' }) : { id: process.env.PROJECT_ID, typeOf: 'Project' };
        let movie = Object.assign({}, req.body, { id: '', duration: (typeof req.body.duration === 'string') ? moment.duration(req.body.duration)
                // tslint:disable-next-line:no-null-keyword
                .toISOString() : null, project: project });
        movie = yield creativeWorkRepo.saveMovie(movie);
        res.status(http_status_1.CREATED)
            .json(movie);
    }
    catch (error) {
        next(error);
    }
}));
movieRouter.get('', permitScopes_1.default(['admin', 'creativeWorks', 'creativeWorks.read-only']), ...[
    check_1.query('datePublishedFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('datePublishedThrough')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('offers.availableFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('offers.availableThrough')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('offers.validFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.query('offers.validThrough')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const creativeWorkRepo = new chevre.repository.CreativeWork(mongoose.connection);
        const searchCoinditions = Object.assign({}, req.query, { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const totalCount = yield creativeWorkRepo.countMovies(searchCoinditions);
        const movies = yield creativeWorkRepo.searchMovies(searchCoinditions);
        res.set('X-Total-Count', totalCount.toString());
        res.json(movies);
    }
    catch (error) {
        next(error);
    }
}));
movieRouter.get('/:id', permitScopes_1.default(['admin', 'creativeWorks', 'creativeWorks.read-only']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const creativeWorkRepo = new chevre.repository.CreativeWork(mongoose.connection);
        const movie = yield creativeWorkRepo.findMovieById({ id: req.params.id });
        res.json(movie);
    }
    catch (error) {
        next(error);
    }
}));
movieRouter.put('/:id', permitScopes_1.default(['admin']), ...[
    check_1.body('datePublished')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.body('datePublished')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.body('offers.availabilityStarts')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.body('offers.availabilityEnds')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.body('offers.validFrom')
        .optional()
        .isISO8601()
        .toDate(),
    check_1.body('offers.validThrough')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const creativeWorkRepo = new chevre.repository.CreativeWork(mongoose.connection);
        const movie = Object.assign({}, req.body, { id: req.params.id, duration: (typeof req.body.duration === 'string') ? moment.duration(req.body.duration)
                // tslint:disable-next-line:no-null-keyword
                .toISOString() : null });
        yield creativeWorkRepo.saveMovie(movie);
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
movieRouter.delete('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
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
