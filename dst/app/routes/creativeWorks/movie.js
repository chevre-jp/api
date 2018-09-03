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
const http_status_1 = require("http-status");
const moment = require("moment");
const authentication_1 = require("../../middlewares/authentication");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const movieRouter = express_1.Router();
movieRouter.use(authentication_1.default);
movieRouter.post('', permitScopes_1.default(['admin']), (_, __, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const movie = {
            typeOf: chevre.factory.creativeWorkType.Movie,
            identifier: req.body.identifier,
            name: req.body.name,
            duration: moment.duration(req.body.duration).toISOString(),
            contentRating: req.body.contentRating
        };
        const creativeWorkRepo = new chevre.repository.CreativeWork(chevre.mongoose.connection);
        yield creativeWorkRepo.saveMovie(movie);
        res.status(http_status_1.CREATED).json(movie);
    }
    catch (error) {
        next(error);
    }
}));
movieRouter.get('', permitScopes_1.default(['admin', 'creativeWorks', 'creativeWorks.read-only']), (_, __, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const creativeWorkRepo = new chevre.repository.CreativeWork(chevre.mongoose.connection);
        const searchCoinditions = {
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
            page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
            sort: req.query.sort,
            identifier: req.query.identifier,
            name: req.query.name
        };
        const totalCount = yield creativeWorkRepo.countMovies(searchCoinditions);
        const movies = yield creativeWorkRepo.searchMovies(searchCoinditions);
        res.set('X-Total-Count', totalCount.toString());
        res.json(movies);
    }
    catch (error) {
        next(error);
    }
}));
movieRouter.get('/:identifier', permitScopes_1.default(['admin', 'creativeWorks', 'creativeWorks.read-only']), (_, __, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const creativeWorkRepo = new chevre.repository.CreativeWork(chevre.mongoose.connection);
        const movie = yield creativeWorkRepo.findMovieByIdentifier({ identifier: req.params.identifier });
        res.json(movie);
    }
    catch (error) {
        next(error);
    }
}));
movieRouter.put('/:identifier', permitScopes_1.default(['admin']), (_, __, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const movie = {
            typeOf: chevre.factory.creativeWorkType.Movie,
            identifier: req.params.identifier,
            name: req.body.name,
            duration: moment.duration(Number(req.body.duration), 'm').toISOString(),
            contentRating: req.body.contentRating
        };
        const creativeWorkRepo = new chevre.repository.CreativeWork(chevre.mongoose.connection);
        yield creativeWorkRepo.saveMovie(movie);
        res.status(http_status_1.NO_CONTENT).end();
    }
    catch (error) {
        next(error);
    }
}));
movieRouter.delete('/:identifier', permitScopes_1.default(['admin']), (_, __, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const creativeWorkRepo = new chevre.repository.CreativeWork(chevre.mongoose.connection);
        yield creativeWorkRepo.deleteMovie({ identifier: req.params.identifier });
        res.status(http_status_1.NO_CONTENT).end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = movieRouter;
