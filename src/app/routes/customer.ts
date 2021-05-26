/**
 * 顧客ルーター
 */
import * as chevre from '@chevre/domain';
import { RequestHandler, Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, query } from 'express-validator';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

export type ICustomer = any;
export type ISearchConditions = any;

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
    body('url')
        .optional()
        .isURL(),
    body('contactPoint')
        .optional()
        .isArray(),
    body('additionalProperty')
        .optional()
        .isArray()
];

const customersRouter = Router();

/**
 * 顧客作成
 */
customersRouter.post(
    '',
    permitScopes(['customers.*']),
    ...validations,
    validator,
    async (req, res, next) => {
        try {
            const project: chevre.factory.project.IProject = { id: req.body.project.id, typeOf: chevre.factory.organizationType.Project };

            const attributes: ICustomer = {
                ...req.body,
                project: project
            };

            const customerRepo = new chevre.repository.Customer(mongoose.connection);
            const customer = await customerRepo.save({ attributes: attributes });

            res.status(CREATED)
                .json(customer);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 顧客検索
 */
customersRouter.get(
    '',
    permitScopes(['customers.*', 'customers.read']),
    ...[
        query('$projection.*')
            .toInt()
    ],
    validator,
    async (req, res, next) => {
        try {
            const searchConditions: ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const customerRepo = new chevre.repository.Customer(mongoose.connection);
            const customers = await customerRepo.search(
                searchConditions,
                (req.query.$projection !== undefined && req.query.$projection !== null) ? { ...req.query.$projection } : undefined
            );

            res.json(customers);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * IDで顧客検索
 */
// tslint:disable-next-line:use-default-type-parameter
customersRouter.get<ParamsDictionary>(
    '/:id',
    permitScopes(['customers.*', 'customers.read']),
    ...[
        query('$projection.*')
            .toInt()
    ],
    validator,
    async (req, res, next) => {
        try {
            const customerRepo = new chevre.repository.Customer(mongoose.connection);
            const customer = await customerRepo.findById(
                { id: req.params.id },
                (req.query.$projection !== undefined && req.query.$projection !== null) ? { ...req.query.$projection } : undefined
            );

            res.json(customer);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 顧客更新
 */
// tslint:disable-next-line:use-default-type-parameter
customersRouter.put<ParamsDictionary>(
    '/:id',
    permitScopes(['customers.*']),
    ...validations,
    validator,
    async (req, res, next) => {
        try {
            const attributes: ICustomer = {
                ...req.body
            };

            const customerRepo = new chevre.repository.Customer(mongoose.connection);
            await customerRepo.save({ id: req.params.id, attributes: attributes });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 顧客削除
 */
customersRouter.delete(
    '/:id',
    permitScopes(['customers.*']),
    validator,
    async (req, res, next) => {
        try {
            const customerRepo = new chevre.repository.Customer(mongoose.connection);
            await customerRepo.deleteById({
                id: req.params.id
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default customersRouter;
