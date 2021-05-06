"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 経理レポートルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const mongoose = require("mongoose");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const accountingReportsRouter = express_1.Router();
/**
 * 検索
 */
// tslint:disable-next-line:use-default-type-parameter
accountingReportsRouter.get('', permitScopes_1.default([]), ...[
    express_validator_1.query('limit')
        .optional()
        .isInt()
        .toInt(),
    express_validator_1.query('page')
        .optional()
        .isInt()
        .toInt(),
    express_validator_1.query('order.orderDate.$gte')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('order.orderDate.$lte')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('order.acceptedOffers.itemOffered.reservationFor.startDate.$gte')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('order.acceptedOffers.itemOffered.reservationFor.startDate.$lte')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // tslint:disable-next-line:no-magic-numbers
        const limit = (typeof ((_a = req.query) === null || _a === void 0 ? void 0 : _a.limit) === 'number') ? Math.min(req.query.limit, 100) : 100;
        const page = (typeof ((_b = req.query) === null || _b === void 0 ? void 0 : _b.page) === 'number') ? Math.max(req.query.page, 1) : 1;
        const reportRepo = new chevre.repository.AccountingReport(mongoose.connection);
        const unwindAcceptedOffers = req.query.$unwindAcceptedOffers === '1';
        const matchStages = request2matchStages(req);
        const aggregate = reportRepo.accountingReportModel.aggregate([
            { $unwind: '$hasPart' },
            ...(unwindAcceptedOffers) ? [{ $unwind: '$mainEntity.acceptedOffers' }] : [],
            ...matchStages,
            {
                $project: {
                    _id: 0,
                    mainEntity: '$hasPart.mainEntity',
                    // typeOf: '$hasPart.mainEntity.typeOf',
                    // endDate: '$hasPart.mainEntity.endDate',
                    // startDate: '$hasPart.mainEntity.startDate',
                    // object: { $arrayElemAt: ['$hasPart.mainEntity.object', 0] },
                    // purpose: '$hasPart.mainEntity.purpose',
                    isPartOf: {
                        mainEntity: '$mainEntity'
                        // acceptedOffers: '$mainEntity.acceptedOffers',
                        // confirmationNumber: '$mainEntity.confirmationNumber',
                        // customer: '$mainEntity.customer',
                        // numItems: '$mainEntity.numItems',
                        // orderNumber: '$mainEntity.orderNumber',
                        // orderDate: '$mainEntity.orderDate',
                        // price: '$mainEntity.price',
                        // project: '$mainEntity.project',
                        // seller: '$mainEntity.seller'
                    }
                }
            }
        ]);
        const reports = yield aggregate.limit(limit * page)
            .skip(limit * (page - 1))
            // .setOptions({ maxTimeMS: 10000 }))
            .exec();
        res.json(reports);
    }
    catch (error) {
        next(error);
    }
}));
function request2matchStages(req) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    const matchStages = [];
    const projectIdEq = (_b = (_a = req.query.project) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.$eq;
    if (typeof projectIdEq === 'string') {
        matchStages.push({
            $match: { 'project.id': { $eq: projectIdEq } }
        });
    }
    const orderNumberEq = (_d = (_c = req.query.order) === null || _c === void 0 ? void 0 : _c.orderNumber) === null || _d === void 0 ? void 0 : _d.$eq;
    if (typeof orderNumberEq === 'string') {
        matchStages.push({
            $match: { 'mainEntity.orderNumber': { $eq: orderNumberEq } }
        });
    }
    const paymentMethodIdEq = (_g = (_f = (_e = req.query.order) === null || _e === void 0 ? void 0 : _e.paymentMethods) === null || _f === void 0 ? void 0 : _f.paymentMethodId) === null || _g === void 0 ? void 0 : _g.$eq;
    if (typeof paymentMethodIdEq === 'string') {
        matchStages.push({
            $match: { 'mainEntity.paymentMethods.paymentMethodId': { $exists: true, $eq: paymentMethodIdEq } }
        });
    }
    const orderDateGte = (_j = (_h = req.query.order) === null || _h === void 0 ? void 0 : _h.orderDate) === null || _j === void 0 ? void 0 : _j.$gte;
    if (orderDateGte instanceof Date) {
        matchStages.push({
            $match: { 'mainEntity.orderDate': { $gte: orderDateGte } }
        });
    }
    const orderDateLte = (_l = (_k = req.query.order) === null || _k === void 0 ? void 0 : _k.orderDate) === null || _l === void 0 ? void 0 : _l.$lte;
    if (orderDateLte instanceof Date) {
        matchStages.push({
            $match: { 'mainEntity.orderDate': { $lte: orderDateLte } }
        });
    }
    const reservationForStartDateGte = (_r = (_q = (_p = (_o = (_m = req.query.order) === null || _m === void 0 ? void 0 : _m.acceptedOffers) === null || _o === void 0 ? void 0 : _o.itemOffered) === null || _p === void 0 ? void 0 : _p.reservationFor) === null || _q === void 0 ? void 0 : _q.startDate) === null || _r === void 0 ? void 0 : _r.$gte;
    if (reservationForStartDateGte instanceof Date) {
        matchStages.push({
            $match: {
                'mainEntity.acceptedOffers.itemOffered.reservationFor.startDate': {
                    $exists: true,
                    $gte: reservationForStartDateGte
                }
            }
        });
    }
    const reservationForStartDateLte = (_w = (_v = (_u = (_t = (_s = req.query.order) === null || _s === void 0 ? void 0 : _s.acceptedOffers) === null || _t === void 0 ? void 0 : _t.itemOffered) === null || _u === void 0 ? void 0 : _u.reservationFor) === null || _v === void 0 ? void 0 : _v.startDate) === null || _w === void 0 ? void 0 : _w.$lte;
    if (reservationForStartDateLte instanceof Date) {
        matchStages.push({
            $match: {
                'mainEntity.acceptedOffers.itemOffered.reservationFor.startDate': {
                    $exists: true,
                    $lte: reservationForStartDateLte
                }
            }
        });
    }
    return matchStages;
}
exports.default = accountingReportsRouter;
