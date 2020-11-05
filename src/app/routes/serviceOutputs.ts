/**
 * サービスアウトプットルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { body, query } from 'express-validator';
import { CREATED } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

import * as redis from '../../redis';

const MAX_NUM_IDENTIFIERS_CREATED = 100;

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
                ...(req.query.project?.id !== undefined) ? { 'project.id': req.query.project?.id } : undefined,
                ...(req.query.typeOf !== undefined) ? { typeOf: req.query.typeOf } : undefined,
                ...(req.query.identifier !== undefined) ? { identifier: req.query.identifier } : undefined,
                ...(req.query.accessCode !== undefined) ? { accessCode: req.query.accessCode } : undefined,
                ...(req.query.issuedBy?.id !== undefined) ? { 'issuedBy.id': req.query.issuedBy?.id } : undefined,
                ...(req.query.issuedThrough?.id !== undefined) ? { 'issuedThrough.id': req.query.issuedThrough?.id } : undefined,
                ...(req.query.issuedThrough?.typeOf !== undefined) ? { 'issuedThrough.typeOf': req.query.issuedThrough?.typeOf } : undefined
            })
                .limit(req.query.limit)
                .skip(req.query.limit * (req.query.page - 1))
                .select({ __v: 0, createdAt: 0, updatedAt: 0 })
                .exec()
                .then((docs) => docs.map((doc) => doc.toObject()));

            res.json(serviceOutputs);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * サービスアウトプット識別子発行
 */
serviceOutputsRouter.post(
    '/identifier',
    permitScopes(['admin']),
    ...[
        body()
            .isArray({ min: 1, max: MAX_NUM_IDENTIFIERS_CREATED })
            .withMessage(() => `must be an array <= ${MAX_NUM_IDENTIFIERS_CREATED}`),
        body('*.project.id')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const identifierRepo = new chevre.repository.ServiceOutputIdentifier(redis.getClient());

            const identifiers = await Promise.all((<any[]>req.body).map(async () => {
                const identifier = await identifierRepo.publishByTimestamp({ startDate: new Date() });

                return { identifier };
            }));

            res.status(CREATED)
                .json(identifiers);
        } catch (error) {
            next(error);
        }
    }
);

export default serviceOutputsRouter;
