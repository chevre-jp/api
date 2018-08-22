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
 * 予約ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const authentication_1 = require("../middlewares/authentication");
// import permitScopes from '../middlewares/permitScopes';
const validator_1 = require("../middlewares/validator");
const reservationsRouter = express_1.Router();
reservationsRouter.use(authentication_1.default);
reservationsRouter.get('/eventReservation/screeningEvent', 
// permitScopes(['aws.cognito.signin.user.admin', 'events', 'events.read-only']),
(_, __, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const reservationRepo = new chevre.repository.Reservation(chevre.mongoose.connection);
        const reservations = yield reservationRepo.searchScreeningEventReservations({
            reservationStatuses: (Array.isArray(req.query.reservationStatuses)) ? req.query.reservationStatuses : undefined,
            ids: (Array.isArray(req.query.ids)) ? req.query.ids : undefined
        });
        res.json(reservations);
    }
    catch (error) {
        next(error);
    }
}));
reservationsRouter.get('/eventReservation/screeningEvent/:id', 
// permitScopes(['aws.cognito.signin.user.admin', 'events', 'events.read-only']),
(_, __, next) => {
    next();
}, validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const reservationRepo = new chevre.repository.Reservation(chevre.mongoose.connection);
        const reservation = yield reservationRepo.findScreeningEventReservationById({
            id: req.params.id
        });
        res.json(reservation);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = reservationsRouter;
