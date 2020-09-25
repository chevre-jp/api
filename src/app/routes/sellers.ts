/**
 * 販売者ルーター
 */
import * as chevre from '@chevre/domain';
import { RequestHandler, Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, query } from 'express-validator';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

/**
 * 販売者に対するバリデーション
 */
const validations: RequestHandler[] = [
    body('project.id')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    body('typeOf')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    body('name.ja')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    body('name.en')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    body('parentOrganization.typeOf')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    body('parentOrganization.name.ja')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    body('parentOrganization.name.en')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    body('url')
        .optional()
        .isURL(),
    body('paymentAccepted')
        .optional()
        .isArray(),
    body('areaServed')
        .optional()
        .isArray(),
    body('hasMerchantReturnPolicy')
        .optional()
        .isArray(),
    body('paymentAccepted')
        .optional()
        .isArray(),
    body('additionalProperty')
        .optional()
        .isArray()
];

const sellersRouter = Router();

sellersRouter.use(authentication);

/**
 * 販売者作成
 */
sellersRouter.post(
    '',
    permitScopes(['admin']),
    ...validations,
    validator,
    async (req, res, next) => {
        try {
            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: chevre.factory.organizationType.Project };

            const attributes: chevre.factory.seller.ISeller = {
                ...req.body,
                project: project
            };

            const sellerRepo = new chevre.repository.Seller(mongoose.connection);
            const seller = await sellerRepo.save({ attributes: attributes });

            res.status(CREATED)
                .json(seller);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 販売者検索
 */
sellersRouter.get(
    '',
    permitScopes(['admin']),
    ...[
        query('$projection.*')
            .toInt()
    ],
    validator,
    async (req, res, next) => {
        try {
            const searchConditions: chevre.factory.seller.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const sellerRepo = new chevre.repository.Seller(mongoose.connection);
            const sellers = await sellerRepo.search(
                searchConditions,
                (req.query.$projection !== undefined && req.query.$projection !== null) ? { ...req.query.$projection } : undefined
                // 管理者以外にセキュアな情報を露出しないように
                // (!req.isAdmin) ? { 'paymentAccepted.gmoInfo.shopPass': 0 } : undefined
            );

            res.json(sellers);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * IDで販売者検索
 */
// tslint:disable-next-line:use-default-type-parameter
sellersRouter.get<ParamsDictionary>(
    '/:id',
    permitScopes(['admin']),
    ...[
        query('$projection.*')
            .toInt()
    ],
    validator,
    async (req, res, next) => {
        try {
            const sellerRepo = new chevre.repository.Seller(mongoose.connection);
            const seller = await sellerRepo.findById(
                { id: req.params.id },
                (req.query.$projection !== undefined && req.query.$projection !== null) ? { ...req.query.$projection } : undefined
                // 管理者以外にセキュアな情報を露出しないように
                // (!req.isAdmin) ? { 'paymentAccepted.gmoInfo.shopPass': 0 } : undefined
            );

            res.json(seller);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 販売者更新
 */
// tslint:disable-next-line:use-default-type-parameter
sellersRouter.put<ParamsDictionary>(
    '/:id',
    permitScopes(['admin']),
    ...validations,
    validator,
    async (req, res, next) => {
        try {
            const attributes: chevre.factory.seller.ISeller = {
                ...req.body
            };

            const sellerRepo = new chevre.repository.Seller(mongoose.connection);
            await sellerRepo.save({ id: req.params.id, attributes: attributes });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 販売者削除
 */
sellersRouter.delete(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const sellerRepo = new chevre.repository.Seller(mongoose.connection);
            await sellerRepo.deleteById({
                id: req.params.id
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default sellersRouter;
