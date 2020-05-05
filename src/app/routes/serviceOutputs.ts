/**
 * サービスアウトプットルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { query } from 'express-validator/check';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const serviceOutputsRouter = Router();
serviceOutputsRouter.use(authentication);

/**
 * 検索
 */
serviceOutputsRouter.get(
    '',
    permitScopes(['admin', 'serviceOutputs', 'serviceOutputs.read-only']),
    ...[
        query('limit')
            .optional()
            .isInt()
            .toInt(),
        query('page')
            .optional()
            .isInt()
            .toInt()
        // query('bookingFrom')
        //     .optional()
        //     .isISO8601()
        //     .toDate(),
        // query('bookingThrough')
        //     .optional()
        //     .isISO8601()
        //     .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const serviceOutputRepo = new chevre.repository.ServiceOutput(mongoose.connection);
            // const searchConditions: chevre.factory.reservation.ISearchConditions<any> = {
            //     ...req.query,
            //     // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            //     limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
            //     page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
            //     sort: { bookingTime: chevre.factory.sortType.Descending }
            // };

            const serviceOutputs = await serviceOutputRepo.serviceOutputModel.find({
                ...(req.query.project !== undefined) ? { project: req.query.project } : undefined,
                ...(req.query.typeOf !== undefined) ? { typeOf: req.query.typeOf } : undefined,
                ...(req.query.identifier !== undefined) ? { identifier: req.query.identifier } : undefined,
                ...(req.query.accessCode !== undefined) ? { accessCode: req.query.accessCode } : undefined
            })
                .limit(req.query.limit)
                .skip(req.query.limit * (req.query.page - 1))
                .exec()
                .then((docs) => docs.map((doc) => doc.toObject()));

            res.json(serviceOutputs);
        } catch (error) {
            next(error);
        }
    }
);

export default serviceOutputsRouter;
