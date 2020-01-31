/**
 * カテゴリーコードルーター
 */
import * as chevre from '@chevre/domain';
import { RequestHandler, Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body, query } from 'express-validator/check';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const categoryCodesRouter = Router();

/**
 * カテゴリーコードに対するバリデーション
 */
const validations: RequestHandler[] = [
    body('project')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    body('project.id')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
        .isString(),
    body('codeValue')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
        .isString(),
    body('inCodeSet')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    body('inCodeSet.identifier')
        .not()
        .isEmpty()
        .withMessage(() => 'Required')
        .isString()
];

categoryCodesRouter.use(authentication);

categoryCodesRouter.post(
    '',
    permitScopes(['admin']),
    ...validations,
    validator,
    async (req, res, next) => {
        try {
            const project: chevre.factory.project.IProject = { id: req.body.project.id, typeOf: 'Project' };

            let categoryCode: chevre.factory.categoryCode.ICategoryCode = {
                ...req.body,
                project: project
            };

            const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);
            const doc = await categoryCodeRepo.categoryCodeModel.create(categoryCode);

            categoryCode = doc.toObject();

            res.status(CREATED)
                .json(categoryCode);
        } catch (error) {
            next(error);
        }
    }
);

categoryCodesRouter.get(
    '',
    permitScopes(['admin']),
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
            const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);

            const searchConditions: chevre.factory.categoryCode.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const categoryCodes = await categoryCodeRepo.search(searchConditions);

            res.json(categoryCodes);
        } catch (error) {
            next(error);
        }
    }
);

categoryCodesRouter.get(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);

            const categoryCode = await categoryCodeRepo.findById({ id: req.params.id });

            res.json(categoryCode);
        } catch (error) {
            next(error);
        }
    }
);

categoryCodesRouter.put(
    '/:id',
    permitScopes(['admin']),
    ...validations,
    validator,
    async (req, res, next) => {
        try {
            const project: chevre.factory.project.IProject = { id: req.body.project.id, typeOf: 'Project' };

            const categoryCode: chevre.factory.categoryCode.ICategoryCode = {
                ...req.body,
                project: project
            };
            delete categoryCode.id;

            const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);
            await categoryCodeRepo.categoryCodeModel.findByIdAndUpdate(
                req.params.id,
                categoryCode
            )
                .exec();

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

categoryCodesRouter.delete(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);

            await categoryCodeRepo.deleteById({
                id: req.params.id
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default categoryCodesRouter;
