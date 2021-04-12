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
 * 注文ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const moment = require("moment");
const mongoose = require("mongoose");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const ordersRouter = express_1.Router();
ordersRouter.use(authentication_1.default);
/**
 * 注文作成
 */
// tslint:disable-next-line:use-default-type-parameter
ordersRouter.put('/:orderNumber', permitScopes_1.default(['admin']), ...[], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderRepo = new chevre.repository.Order(mongoose.connection);
        const orderNumber = req.params.orderNumber;
        const order = createOrder(Object.assign(Object.assign({}, req.body), { orderNumber }));
        yield orderRepo.createIfNotExist(order);
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
function createOrder(params) {
    // 必要な属性についてDate型に変換(でないと検索クエリを効率的に使えない)
    const acceptedOffers = (Array.isArray(params.acceptedOffers))
        ? params.acceptedOffers.map((o) => {
            if (o.itemOffered.typeOf === chevre.factory.reservationType.EventReservation) {
                let itemOffered = o.itemOffered;
                const reservationFor = itemOffered.reservationFor;
                itemOffered = Object.assign(Object.assign({}, itemOffered), { reservationFor: Object.assign(Object.assign(Object.assign(Object.assign({}, reservationFor), (typeof reservationFor.doorTime !== undefined)
                        ? {
                            doorTime: moment(reservationFor.doorTime)
                                .toDate()
                        }
                        : undefined), (typeof reservationFor.endDate !== undefined)
                        ? {
                            endDate: moment(reservationFor.endDate)
                                .toDate()
                        }
                        : undefined), (typeof reservationFor.startDate !== undefined)
                        ? {
                            startDate: moment(reservationFor.startDate)
                                .toDate()
                        }
                        : undefined) });
                return Object.assign(Object.assign({}, o), { itemOffered });
            }
            else {
                return o;
            }
        })
        : [];
    return Object.assign(Object.assign(Object.assign({}, params), { orderDate: moment(params.orderDate)
            .toDate(), acceptedOffers }), (params.dateReturned !== null && params.dateReturned !== undefined)
        ? {
            dateReturned: moment(params.dateReturned)
                .toDate()
        }
        : undefined);
}
/**
 * 注文配送
 */
// tslint:disable-next-line:use-default-type-parameter
ordersRouter.put(`/:orderNumber/${chevre.factory.orderStatus.OrderDelivered}`, permitScopes_1.default(['admin']), ...[], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderRepo = new chevre.repository.Order(mongoose.connection);
        const orderNumber = req.params.orderNumber;
        const order = yield orderRepo.changeStatus({
            orderNumber,
            orderStatus: chevre.factory.orderStatus.OrderDelivered,
            previousOrderStatus: chevre.factory.orderStatus.OrderProcessing
        });
        res.json(order);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 注文返品
 */
// tslint:disable-next-line:use-default-type-parameter
ordersRouter.put(`/:orderNumber/${chevre.factory.orderStatus.OrderReturned}`, permitScopes_1.default(['admin']), ...[
    express_validator_1.body('dateReturned')
        .not()
        .isEmpty()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderRepo = new chevre.repository.Order(mongoose.connection);
        const orderNumber = req.params.orderNumber;
        const order = yield orderRepo.returnOrder({
            orderNumber,
            dateReturned: req.body.dateReturned,
            returner: req.body.returner
        });
        res.json(order);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = ordersRouter;
