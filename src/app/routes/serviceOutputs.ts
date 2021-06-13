/**
 * サービスアウトプットルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { body, query } from 'express-validator';
import { CREATED } from 'http-status';
import * as mongoose from 'mongoose';

import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

import * as redis from '../../redis';

const MAX_NUM_IDENTIFIERS_CREATED = 100;

const serviceOutputsRouter = Router();

/**
 * 検索
 */
serviceOutputsRouter.get(
    '',
    permitScopes(['serviceOutputs', 'serviceOutputs.read-only']),
    ...[
        query('limit')
            .optional()
            .isInt()
            .toInt(),
        query('page')
            .optional()
            .isInt()
            .toInt()
    ],
    validator,
    async (req, res, next) => {
        try {
            const serviceOutputRepo = new chevre.repository.ServiceOutput(mongoose.connection);
            const searchConditions: chevre.factory.product.IServiceOutputSearchConditions = {
                ...req.query,
                project: { id: { $eq: req.project.id } },
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };
            const serviceOutputs = await serviceOutputRepo.search(searchConditions);

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
    permitScopes([]),
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
