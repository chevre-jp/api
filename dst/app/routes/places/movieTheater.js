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
 * 劇場ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const movieTheaterRouter = express_1.Router();
movieTheaterRouter.post('', permitScopes_1.default(['admin']), ...[
    express_validator_1.body('project')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('branchCode')
        .not()
        .isEmpty(),
    express_validator_1.body('name')
        .not()
        .isEmpty()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = Object.assign(Object.assign({}, req.body.project), { typeOf: chevre.factory.organizationType.Project });
        let movieTheater = Object.assign(Object.assign({}, req.body), { typeOf: chevre.factory.placeType.MovieTheater, id: '', project: project });
        const placeRepo = new chevre.repository.Place(mongoose.connection);
        movieTheater = yield placeRepo.saveMovieTheater(movieTheater);
        res.status(http_status_1.CREATED)
            .json(movieTheater);
    }
    catch (error) {
        next(error);
    }
}));
movieTheaterRouter.get('', permitScopes_1.default(['admin', 'places', 'places.read-only']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const placeRepo = new chevre.repository.Place(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const movieTheaters = yield placeRepo.searchMovieTheaters(searchConditions);
        res.json(movieTheaters);
    }
    catch (error) {
        next(error);
    }
}));
movieTheaterRouter.get('/:id', permitScopes_1.default(['admin', 'places', 'places.read-only']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const placeRepo = new chevre.repository.Place(mongoose.connection);
        const movieTheater = yield placeRepo.findById({ id: req.params.id });
        res.json(movieTheater);
    }
    catch (error) {
        next(error);
    }
}));
// tslint:disable-next-line:use-default-type-parameter
movieTheaterRouter.put('/:id', permitScopes_1.default(['admin']), ...[
    express_validator_1.body('branchCode')
        .not()
        .isEmpty(),
    express_validator_1.body('name')
        .not()
        .isEmpty()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const movieTheater = Object.assign(Object.assign({}, req.body), { typeOf: chevre.factory.placeType.MovieTheater, id: req.params.id });
        const placeRepo = new chevre.repository.Place(mongoose.connection);
        yield placeRepo.saveMovieTheater(movieTheater);
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
movieTheaterRouter.delete('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const placeRepo = new chevre.repository.Place(mongoose.connection);
        yield placeRepo.placeModel.findOneAndDelete({
            _id: req.params.id
        })
            .exec()
            .then((doc) => {
            if (doc === null) {
                throw new chevre.factory.errors.NotFound(placeRepo.placeModel.modelName);
            }
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = movieTheaterRouter;
