"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ルーター
 */
const express = require("express");
const accountTitles_1 = require("./accountTitles");
const categoryCode_1 = require("./categoryCode");
const creativeWorks_1 = require("./creativeWorks");
const events_1 = require("./events");
const health_1 = require("./health");
const offerCatalogs_1 = require("./offerCatalogs");
const offers_1 = require("./offers");
const places_1 = require("./places");
const priceSpecifications_1 = require("./priceSpecifications");
const products_1 = require("./products");
const reservations_1 = require("./reservations");
const stats_1 = require("./stats");
const tasks_1 = require("./tasks");
const transactions_1 = require("./transactions");
const router = express.Router();
// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })
router.use('/health', health_1.default);
router.use('/accountTitles', accountTitles_1.default);
router.use('/categoryCodes', categoryCode_1.default);
router.use('/creativeWorks', creativeWorks_1.default);
router.use('/places', places_1.default);
router.use('/events', events_1.default);
router.use('/offers', offers_1.default);
router.use('/offerCatalogs', offerCatalogs_1.default);
router.use('/priceSpecifications', priceSpecifications_1.default);
router.use('/products', products_1.default);
router.use('/reservations', reservations_1.default);
router.use('/stats', stats_1.default);
router.use('/tasks', tasks_1.default);
router.use('/transactions', transactions_1.default);
exports.default = router;
