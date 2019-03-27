"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ルーター
 */
const express = require("express");
const accountTitles_1 = require("./accountTitles");
const boxOfficeTypes_1 = require("./boxOfficeTypes");
const creativeWorks_1 = require("./creativeWorks");
const distributeRouter_1 = require("./distributions/distributeRouter");
const events_1 = require("./events");
const places_1 = require("./places");
const priceSpecifications_1 = require("./priceSpecifications");
const reservations_1 = require("./reservations");
const serviceTypes_1 = require("./serviceTypes");
const subject_1 = require("./subject");
const ticketTypeGroups_1 = require("./ticketTypeGroups");
const ticketTypes_1 = require("./ticketTypes");
const transactions_1 = require("./transactions");
const router = express.Router();
// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })
router.use('/accountTitles', accountTitles_1.default);
router.use('/creativeWorks', creativeWorks_1.default);
router.use('/distributions', distributeRouter_1.default);
router.use('/boxOfficeTypes', boxOfficeTypes_1.default);
router.use('/places', places_1.default);
router.use('/events', events_1.default);
router.use('/priceSpecifications', priceSpecifications_1.default);
router.use('/reservations', reservations_1.default);
router.use('/serviceTypes', serviceTypes_1.default);
router.use('/subjects', subject_1.default);
router.use('/ticketTypeGroups', ticketTypeGroups_1.default);
router.use('/ticketTypes', ticketTypes_1.default);
router.use('/transactions', transactions_1.default);
exports.default = router;
