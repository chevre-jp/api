/**
 * 注文ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body } from 'express-validator';
import { NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const ordersRouter = Router();
ordersRouter.use(authentication);

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
            const orderRepo = new chevre.repository.Order(mongoose.connection);
            const orderNumber = req.params.orderNumber;
            const order = createOrder({
                ...req.body,
                orderNumber
            });

            await orderRepo.createIfNotExist(order);

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
