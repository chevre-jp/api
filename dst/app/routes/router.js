"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ルーター
 */
const express = require("express");
const _ah_1 = require("./_ah");
const accountTitles_1 = require("./accountTitles");
const actions_1 = require("./actions");
const categoryCode_1 = require("./categoryCode");
const creativeWorks_1 = require("./creativeWorks");
const events_1 = require("./events");
const health_1 = require("./health");
const offerCatalogs_1 = require("./offerCatalogs");
const offers_1 = require("./offers");
const places_1 = require("./places");
const priceSpecifications_1 = require("./priceSpecifications");
const products_1 = require("./products");
const projects_1 = require("./projects");
const reservations_1 = require("./reservations");
const sellers_1 = require("./sellers");
const serviceOutputIdentifiers_1 = require("./serviceOutputIdentifiers");
const serviceOutputs_1 = require("./serviceOutputs");
const stats_1 = require("./stats");
const tasks_1 = require("./tasks");
const transactionNumbers_1 = require("./transactionNumbers");
const transactions_1 = require("./transactions");
const router = express.Router();
// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })
router.use('/_ah', _ah_1.default);
router.use('/health', health_1.default);
router.use('/accountTitles', accountTitles_1.default);
router.use('/actions', actions_1.default);
router.use('/categoryCodes', categoryCode_1.default);
router.use('/creativeWorks', creativeWorks_1.default);
router.use('/places', places_1.default);
router.use('/events', events_1.default);
router.use('/offers', offers_1.default);
router.use('/offerCatalogs', offerCatalogs_1.default);
router.use('/priceSpecifications', priceSpecifications_1.default);
router.use('/products', products_1.default);
router.use('/projects', projects_1.default);
router.use('/reservations', reservations_1.default);
router.use('/sellers', sellers_1.default);
router.use('/serviceOutputIdentifiers', serviceOutputIdentifiers_1.default);
router.use('/serviceOutputs', serviceOutputs_1.default);
router.use('/stats', stats_1.default);
router.use('/tasks', tasks_1.default);
router.use('/transactions', transactions_1.default);
router.use('/transactionNumbers', transactionNumbers_1.default);
exports.default = router;
