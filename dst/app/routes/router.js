"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ルーター
 */
const express = require("express");
const creativeWorks_1 = require("./creativeWorks");
const dev_1 = require("./dev");
const events_1 = require("./events");
const places_1 = require("./places");
const reservations_1 = require("./reservations");
const ticketTypeGroups_1 = require("./ticketTypeGroups");
const ticketTypes_1 = require("./ticketTypes");
const transactions_1 = require("./transactions");
const router = express.Router();
// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })
router.use('/creativeWorks', creativeWorks_1.default);
router.use('/places', places_1.default);
router.use('/events', events_1.default);
router.use('/reservations', reservations_1.default);
router.use('/ticketTypeGroups', ticketTypeGroups_1.default);
router.use('/ticketTypes', ticketTypes_1.default);
router.use('/transactions', transactions_1.default);
// tslint:disable-next-line:no-single-line-block-comment
/* istanbul ignore next */
if (process.env.NODE_ENV !== 'production') {
    router.use('/dev', dev_1.default);
}
exports.default = router;
