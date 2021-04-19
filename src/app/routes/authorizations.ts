/**
 * 承認ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { body, query } from 'express-validator';
import { CREATED } from 'http-status';
import * as mongoose from 'mongoose';

import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const MAX_NUM_AUTHORIZATIONS_CREATED = 1000;

const authorizationsRouter = Router();

/**
 * 承認作成
 */
authorizationsRouter.post(
    '',
    permitScopes(['admin']),
    ...[
        body()
            .isArray()
            .custom((value) => value.length <= MAX_NUM_AUTHORIZATIONS_CREATED)
            .withMessage(() => 'Array length max exceeded'),
        body('*.project.id')
            .not()
            .isEmpty()
            .isString(),
        body('*.code')
            .not()
            .isEmpty()
            .isString(),
        body('*.object')
            .not()
            .isEmpty(),
        body('*.validFrom')
            .not()
            .isEmpty()
            .isISO8601()
            .toDate(),
        body('*.expiresInSeconds')
            .not()
            .isEmpty()
            .isInt()
            .toInt()
    ],
    validator,
    async (req, res, next) => {
        try {
            const authorizationRepo = new chevre.repository.Code(mongoose.connection);

            const authorizations = await authorizationRepo.save((<any[]>req.body).map((o) => {
                return {
                    project: { typeOf: chevre.factory.organizationType.Project, id: String(o.project?.id) },
                    code: o.code,
                    data: o.object,
                    validFrom: o.validFrom,
                    expiresInSeconds: o.expiresInSeconds
                };
            }));

            res.status(CREATED)
                .json(authorizations);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 承認検索
 */
authorizationsRouter.get(
    '',
    permitScopes(['admin']),
    ...[
        query('project.id.$eq')
            .not()
            .isEmpty()
            .isString(),
        query('validFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('validThrough')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const authorizationRepo = new chevre.repository.Code(mongoose.connection);

            const searchConditions: chevre.factory.authorization.ISearchConditions = {
                ...req.query,
                project: { id: { $eq: String(req.query?.project?.id?.$eq) } },
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const authorizations = await authorizationRepo.search(searchConditions);

            res.json(authorizations);
        } catch (error) {
            next(error);
        }
    }
);

export default authorizationsRouter;
