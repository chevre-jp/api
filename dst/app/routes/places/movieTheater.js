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
 * 劇場ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const authentication_1 = require("../../middlewares/authentication");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
const movieTheaterRouter = express_1.Router();
movieTheaterRouter.use(authentication_1.default);
movieTheaterRouter.get('', permitScopes_1.default(['admin', 'places', 'places.read-only']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
        const searchCoinditions = {
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
            page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
            sort: req.query.sort,
            name: req.query.name
        };
        const totalCount = yield placeRepo.countMovieTheaters(searchCoinditions);
        const movieTheaters = yield placeRepo.searchMovieTheaters(searchCoinditions);
        res.set('X-Total-Count', totalCount.toString());
        res.json(movieTheaters);
    }
    catch (error) {
        next(error);
    }
}));
movieTheaterRouter.get('/:branchCode', permitScopes_1.default(['admin', 'places', 'places.read-only']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
        const movieTheater = yield placeRepo.findMovieTheaterByBranchCode({ branchCode: req.params.branchCode });
        res.json(movieTheater);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = movieTheaterRouter;
