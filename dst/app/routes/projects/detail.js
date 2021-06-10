"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * プロジェクト詳細ルーター
 */
const chevre = require("@chevre/domain");
const express = require("express");
const accountActions_1 = require("../accountActions");
const accountingReports_1 = require("../accountingReports");
const accounts_1 = require("../accounts");
const accountTitles_1 = require("../accountTitles");
const accountTransactions_1 = require("../accountTransactions");
const actions_1 = require("../actions");
const aggregateSales_1 = require("../aggregateSales");
const assetTransactions_1 = require("../assetTransactions");
const authorizations_1 = require("../authorizations");
const categoryCode_1 = require("../categoryCode");
const creativeWorks_1 = require("../creativeWorks");
const customer_1 = require("../customer");
const events_1 = require("../events");
const health_1 = require("../health");
const iam_1 = require("../iam");
const offerCatalogs_1 = require("../offerCatalogs");
const offers_1 = require("../offers");
const orders_1 = require("../orders");
const ownershipInfos_1 = require("../ownershipInfos");
const places_1 = require("../places");
const priceSpecifications_1 = require("../priceSpecifications");
const products_1 = require("../products");
const reservations_1 = require("../reservations");
const sellers_1 = require("../sellers");
const serviceOutputs_1 = require("../serviceOutputs");
const stats_1 = require("../stats");
const tasks_1 = require("../tasks");
const transactionNumbers_1 = require("../transactionNumbers");
const userPools_1 = require("../userPools");
const projectDetailRouter = express.Router();
projectDetailRouter.use((req, _, next) => {
    var _a;
    // プロジェクト未指定は拒否
    if (typeof ((_a = req.project) === null || _a === void 0 ? void 0 : _a.id) !== 'string') {
        next(new chevre.factory.errors.Forbidden('project not specified'));
        return;
    }
    next();
});
projectDetailRouter.use('/health', health_1.default);
projectDetailRouter.use('/accounts', accounts_1.default);
projectDetailRouter.use('/accountActions', accountActions_1.default);
projectDetailRouter.use('/accountingReports', accountingReports_1.default);
projectDetailRouter.use('/accountTitles', accountTitles_1.default);
projectDetailRouter.use('/accountTransactions', accountTransactions_1.default);
projectDetailRouter.use('/actions', actions_1.default);
projectDetailRouter.use('/aggregateSales', aggregateSales_1.default);
projectDetailRouter.use('/assetTransactions', assetTransactions_1.default);
projectDetailRouter.use('/authorizations', authorizations_1.default);
projectDetailRouter.use('/categoryCodes', categoryCode_1.default);
projectDetailRouter.use('/creativeWorks', creativeWorks_1.default);
projectDetailRouter.use('/customers', customer_1.default);
projectDetailRouter.use('/places', places_1.default);
projectDetailRouter.use('/events', events_1.default);
projectDetailRouter.use('/iam', iam_1.default);
projectDetailRouter.use('/offers', offers_1.default);
projectDetailRouter.use('/offerCatalogs', offerCatalogs_1.default);
projectDetailRouter.use('/orders', orders_1.default);
projectDetailRouter.use('/ownershipInfos', ownershipInfos_1.default);
projectDetailRouter.use('/priceSpecifications', priceSpecifications_1.default);
projectDetailRouter.use('/products', products_1.default);
projectDetailRouter.use('/reservations', reservations_1.default);
projectDetailRouter.use('/sellers', sellers_1.default);
projectDetailRouter.use('/serviceOutputs', serviceOutputs_1.default);
projectDetailRouter.use('/stats', stats_1.default);
projectDetailRouter.use('/tasks', tasks_1.default);
projectDetailRouter.use('/transactions', assetTransactions_1.default);
projectDetailRouter.use('/transactionNumbers', transactionNumbers_1.default);
projectDetailRouter.use('/userPools', userPools_1.default);
exports.default = projectDetailRouter;
