"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 場所ルーター
 */
const express_1 = require("express");
const movieTheater_1 = require("./places/movieTheater");
const screeningRoom_1 = require("./places/screeningRoom");
const seat_1 = require("./places/seat");
const placesRouter = express_1.Router();
placesRouter.use('/movieTheater', movieTheater_1.default);
placesRouter.use('/screeningRoom', screeningRoom_1.default);
placesRouter.use('/seat', seat_1.default);
exports.default = placesRouter;
