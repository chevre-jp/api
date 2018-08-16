"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ルーター
 */
const express = require("express");
const dev_1 = require("./dev");
const events_1 = require("./events");
const places_1 = require("./places");
const reservations_1 = require("./reservations");
const cancelReservation_1 = require("./transactions/cancelReservation");
const reserve_1 = require("./transactions/reserve");
const router = express.Router();
// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })
router.use('/places', places_1.default);
router.use('/events', events_1.default);
router.use('/reservations', reservations_1.default);
router.use('/transactions/cancelReservation', cancelReservation_1.default);
router.use('/transactions/reserve', reserve_1.default);
// tslint:disable-next-line:no-single-line-block-comment
/* istanbul ignore next */
if (process.env.NODE_ENV !== 'production') {
    router.use('/dev', dev_1.default);
}
exports.default = router;
