/**
 * 注文ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, query } from 'express-validator';
import { NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const ADDITIONAL_PROPERTY_VALUE_MAX_LENGTH = (process.env.ADDITIONAL_PROPERTY_VALUE_MAX_LENGTH !== undefined)
    ? Number(process.env.ADDITIONAL_PROPERTY_VALUE_MAX_LENGTH)
    // tslint:disable-next-line:no-magic-numbers
    : 256;

const ordersRouter = Router();
ordersRouter.use(authentication);

/**
 * 注文検索
 */
ordersRouter.get(
    '',
    permitScopes(['admin']),
    ...[
        query('project.id.$eq')
            .not()
            .isEmpty()
            .isString(),
        query('disableTotalCount')
            .optional()
            .isBoolean()
            .toBoolean(),
        query('identifier.$all')
            .optional()
            .isArray(),
        query('identifier.$in')
            .optional()
            .isArray(),
        query('identifier.$all.*.name')
            .optional()
            .not()
            .isEmpty()
            .isString()
            .isLength({ max: ADDITIONAL_PROPERTY_VALUE_MAX_LENGTH }),
        query('identifier.$all.*.value')
            .optional()
            .not()
            .isEmpty()
            .isString()
            .isLength({ max: ADDITIONAL_PROPERTY_VALUE_MAX_LENGTH }),
        query('identifier.$in.*.name')
            .optional()
            .not()
            .isEmpty()
            .isString()
            .isLength({ max: ADDITIONAL_PROPERTY_VALUE_MAX_LENGTH }),
        query('identifier.$in.*.value')
            .optional()
            .not()
            .isEmpty()
            .isString()
            .isLength({ max: ADDITIONAL_PROPERTY_VALUE_MAX_LENGTH }),
        query('orderDateFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('orderDateThrough')
            .optional()
            .isISO8601()
            .toDate(),
        query('orderDate.$gte')
            .optional()
            .isISO8601()
            .toDate(),
        query('orderDate.$lte')
            .optional()
            .isISO8601()
            .toDate(),
        query('acceptedOffers.itemOffered.reservationFor.inSessionFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('acceptedOffers.itemOffered.reservationFor.inSessionThrough')
            .optional()
            .isISO8601()
            .toDate(),
        query('acceptedOffers.itemOffered.reservationFor.startFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('acceptedOffers.itemOffered.reservationFor.startThrough')
            .optional()
            .isISO8601()
            .toDate(),
        query('price.$gte')
            .optional()
            .isInt()
            .toInt(),
        query('price.$lte')
            .optional()
            .isInt()
            .toInt()
    ],
    validator,
    async (req, res, next) => {
        try {
            const orderRepo = new chevre.repository.Order(mongoose.connection);

            const searchConditions: chevre.factory.order.ISearchConditions = {
                ...req.query,
                project: { id: { $eq: String(req.query.project?.id?.$eq) } },
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const orders = await orderRepo.search(searchConditions);

            res.json(orders);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 注文取得
 */
ordersRouter.get(
    '/:orderNumber',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const orderRepo = new chevre.repository.Order(mongoose.connection);
            const order = await orderRepo.findByOrderNumber({
                orderNumber: req.params.orderNumber
            });

            res.json(order);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 注文作成
 */
// tslint:disable-next-line:use-default-type-parameter
ordersRouter.put<ParamsDictionary>(
    '/:orderNumber',
    permitScopes(['admin']),
    ...[],
    validator,
    async (req, res, next) => {
        try {
            const accountingReportRepo = new chevre.repository.AccountingReport(mongoose.connection);
            const orderRepo = new chevre.repository.Order(mongoose.connection);
            const orderNumber = req.params.orderNumber;
            const order = createOrder({
                ...req.body,
                orderNumber
            });

            await orderRepo.createIfNotExist(order);

            // 経理レポートを保管
            await chevre.service.webhook.createAccountingReportIfNotExist(order)({ accountingReport: accountingReportRepo });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

function createOrder(params: chevre.factory.order.IOrder): chevre.factory.order.IOrder {
    // 必要な属性についてDate型に変換(でないと検索クエリを効率的に使えない)
    const acceptedOffers = (Array.isArray(params.acceptedOffers))
        ? params.acceptedOffers.map((o) => {
            if (o.itemOffered.typeOf === chevre.factory.reservationType.EventReservation) {
                let itemOffered = <chevre.factory.order.IReservation>o.itemOffered;
                const reservationFor = itemOffered.reservationFor;
                itemOffered = {
                    ...itemOffered,
                    reservationFor: {
                        ...reservationFor,
                        ...(typeof reservationFor.doorTime !== undefined)
                            ? {
                                doorTime: moment(reservationFor.doorTime)
                                    .toDate()
                            }
                            : undefined,
                        ...(typeof reservationFor.endDate !== undefined)
                            ? {
                                endDate: moment(reservationFor.endDate)
                                    .toDate()
                            }
                            : undefined,
                        ...(typeof reservationFor.startDate !== undefined)
                            ? {
                                startDate: moment(reservationFor.startDate)
                                    .toDate()
                            }
                            : undefined

                    }
                };

                return {
                    ...o,
                    itemOffered
                };
            } else {
                return o;
            }
        })
        : [];

    return {
        ...params,
        orderDate: moment(params.orderDate)
            .toDate(),
        acceptedOffers,
        ...(params.dateReturned !== null && params.dateReturned !== undefined)
            ? {
                dateReturned: moment(params.dateReturned)
                    .toDate()
            }
            : undefined
    };
}

/**
 * 注文配送
 */
// tslint:disable-next-line:use-default-type-parameter
ordersRouter.put<ParamsDictionary>(
    `/:orderNumber/${chevre.factory.orderStatus.OrderDelivered}`,
    permitScopes(['admin']),
    ...[],
    validator,
    async (req, res, next) => {
        try {
            const orderRepo = new chevre.repository.Order(mongoose.connection);
            const orderNumber = req.params.orderNumber;

            const order = await orderRepo.changeStatus({
                orderNumber,
                orderStatus: chevre.factory.orderStatus.OrderDelivered,
                previousOrderStatus: chevre.factory.orderStatus.OrderProcessing
            });

            res.json(order);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 注文返品
 */
// tslint:disable-next-line:use-default-type-parameter
ordersRouter.put<ParamsDictionary>(
    `/:orderNumber/${chevre.factory.orderStatus.OrderReturned}`,
    permitScopes(['admin']),
    ...[
        body('dateReturned')
            .not()
            .isEmpty()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const orderRepo = new chevre.repository.Order(mongoose.connection);
            const orderNumber = req.params.orderNumber;

            const order = await orderRepo.returnOrder({
                orderNumber,
                dateReturned: req.body.dateReturned,
                returner: req.body.returner
            });

            res.json(order);
        } catch (error) {
            next(error);
        }
    }
);

export default ordersRouter;
