/**
 * 経理レポートルーター
 */
import * as chevre from '@chevre/domain';

import { Request, Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { query } from 'express-validator';
import * as mongoose from 'mongoose';

import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const accountingReportsRouter = Router();

/**
 * 検索
 */
// tslint:disable-next-line:use-default-type-parameter
accountingReportsRouter.get<ParamsDictionary>(
    '',
    permitScopes(['accountingReports.read']),
    ...[
        query('limit')
            .optional()
            .isInt()
            .toInt(),
        query('page')
            .optional()
            .isInt()
            .toInt(),
        query('order.orderDate.$gte')
            .optional()
            .isISO8601()
            .toDate(),
        query('order.orderDate.$lte')
            .optional()
            .isISO8601()
            .toDate(),
        query('order.acceptedOffers.itemOffered.reservationFor.startDate.$gte')
            .optional()
            .isISO8601()
            .toDate(),
        query('order.acceptedOffers.itemOffered.reservationFor.startDate.$lte')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            // tslint:disable-next-line:no-magic-numbers
            const limit = (typeof req.query?.limit === 'number') ? Math.min(req.query.limit, 100) : 100;
            const page = (typeof req.query?.page === 'number') ? Math.max(req.query.page, 1) : 1;

            const reportRepo = new chevre.repository.AccountingReport(mongoose.connection);

            const unwindAcceptedOffers = req.query.$unwindAcceptedOffers === '1';
            const matchStages = request2matchStages(req);

            const aggregate = reportRepo.accountingReportModel.aggregate(
                [
                    // pipelineの順序に注意
                    // @see https://docs.mongodb.com/manual/reference/operator/aggregation/sort/
                    { $sort: { 'mainEntity.orderDate': chevre.factory.sortType.Descending } },
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
                ]
            );

            const reports = await aggregate.allowDiskUse(true)
                .limit(limit * page)
                .skip(limit * (page - 1))
                // .setOptions({ maxTimeMS: 10000 })
                .exec();

            res.json(reports);
        } catch (error) {
            next(error);
        }
    }
);

function request2matchStages(req: Request): any[] {
    const matchStages: any[] = [];

    const projectIdEq = req.query.project?.id?.$eq;
    if (typeof projectIdEq === 'string') {
        matchStages.push({
            $match: { 'project.id': { $eq: projectIdEq } }
        });
    }

    const orderNumberEq = req.query.order?.orderNumber?.$eq;
    if (typeof orderNumberEq === 'string') {
        matchStages.push({
            $match: { 'mainEntity.orderNumber': { $eq: orderNumberEq } }
        });
    }

    const paymentMethodIdEq = req.query.order?.paymentMethods?.paymentMethodId?.$eq;
    if (typeof paymentMethodIdEq === 'string') {
        matchStages.push({
            $match: { 'mainEntity.paymentMethods.paymentMethodId': { $exists: true, $eq: paymentMethodIdEq } }
        });
    }

    const orderDateGte = req.query.order?.orderDate?.$gte;
    if (orderDateGte instanceof Date) {
        matchStages.push({
            $match: { 'mainEntity.orderDate': { $gte: orderDateGte } }
        });
    }

    const orderDateLte = req.query.order?.orderDate?.$lte;
    if (orderDateLte instanceof Date) {
        matchStages.push({
            $match: { 'mainEntity.orderDate': { $lte: orderDateLte } }
        });
    }

    const reservationForStartDateGte = req.query.order?.acceptedOffers?.itemOffered?.reservationFor?.startDate?.$gte;
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

    const reservationForStartDateLte = req.query.order?.acceptedOffers?.itemOffered?.reservationFor?.startDate?.$lte;
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

export default accountingReportsRouter;
