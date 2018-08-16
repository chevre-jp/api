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
 * 場所ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const placesRouter = express_1.Router();
const authentication_1 = require("../middlewares/authentication");
// import permitScopes from '../middlewares/permitScopes';
const validator_1 = require("../middlewares/validator");
placesRouter.use(authentication_1.default);
/**
 * 劇場検索
 */
placesRouter.get('/movieTheater', 
// permitScopes(['aws.cognito.signin.user.admin', 'places', 'places.read-only']),
validator_1.default, (__, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
        yield placeRepo.searchMovieTheaters({}).then((places) => {
            res.json(places);
        });
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 劇場詳細検索
 */
placesRouter.get('/movieTheater/:branchCode', 
// permitScopes(['aws.cognito.signin.user.admin', 'places', 'places.read-only']),
validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const placeRepo = new chevre.repository.Place(chevre.mongoose.connection);
        const movieTheater = yield placeRepo.findMovieTheaterByBranchCode(req.params.branchCode);
        res.json(movieTheater);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = placesRouter;
