/**
 * カテゴリーコードルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body, query } from 'express-validator/check';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const categoryCodesRouter = Router();

categoryCodesRouter.use(authentication);

categoryCodesRouter.post(
    '',
    permitScopes(['admin']),
    ...[
        body('project')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: 'Project' };

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
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);
            const doc = await categoryCodeRepo.categoryCodeModel.findById(req.params.id)
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound(categoryCodeRepo.categoryCodeModel.modelName);
            }

            const categoryCode = doc.toObject();

            res.json(categoryCode);
        } catch (error) {
            next(error);
        }
    }
);

categoryCodesRouter.put(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const categoryCode: chevre.factory.categoryCode.ICategoryCode = {
                ...req.body
            };
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
            const searchCoinditions: any = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const categoryCodes = await categoryCodeRepo.categoryCodeModel.find({
                ...searchCoinditions,
                limit: undefined,
                page: undefined
            })
                .limit(searchCoinditions.limit)
                .skip(searchCoinditions.limit * (searchCoinditions.page - 1))
                .setOptions({ maxTimeMS: 10000 })
                .exec()
                .then((docs) => docs.map((doc) => doc.toObject()));

            res.json(categoryCodes);
        } catch (error) {
            next(error);
        }
    }
);

export default categoryCodesRouter;
