/**
 * 興行区分ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body } from 'express-validator/check';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const serviceTypesRouter = Router();
serviceTypesRouter.use(authentication);

serviceTypesRouter.post(
    '',
    permitScopes(['admin']),
    ...[
        body('project')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('project.id')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
            .isString()
    ],
    validator,
    async (req, res, next) => {
        try {
            const project: chevre.factory.project.IProject = { id: req.body.project.id, typeOf: 'Project' };

            // let serviceType: chevre.factory.serviceType.IServiceType = {
            //     ...req.body,
            //     typeOf: 'ServiceType',
            //     id: '',
            //     project: project
            // };

            // const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
            // serviceType = await serviceTypeRepo.save(serviceType);

            // res.status(CREATED)
            //     .json(serviceType);

            let categoryCode: chevre.factory.categoryCode.ICategoryCode = {
                ...req.body,
                typeOf: 'CategoryCode',
                inCodeSet: {
                    typeOf: 'CategoryCodeSet',
                    identifier: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType
                },
                name: (typeof req.body.name === 'string')
                    ? { ja: req.body.name }
                    : req.body.name,
                project: project
            };

            const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);
            const doc = await categoryCodeRepo.categoryCodeModel.create(categoryCode);

            categoryCode = doc.toObject();

            res.status(CREATED)
                .json({
                    ...categoryCode,
                    identifier: categoryCode.codeValue,
                    name: (<any>categoryCode.name).ja
                });
        } catch (error) {
            next(error);
        }
    }
);

serviceTypesRouter.get(
    '',
    permitScopes(['admin', 'serviceTypes', 'serviceTypes.read-only']),
    validator,
    async (req, res, next) => {
        try {
            // const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
            // const searchConditions: chevre.factory.serviceType.ISearchConditions = {
            //     ...req.query,
            //     // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            //     limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
            //     page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            // };

            // const serviceTypes = await serviceTypeRepo.search(searchConditions);

            // res.json(serviceTypes);

            const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);

            const searchConditions: chevre.factory.categoryCode.ISearchConditions = {
                ...req.query,
                ...(typeof req.query.name === 'string' && req.query.name.length > 0)
                    ? { name: { $regex: req.query.name } }
                    : undefined,
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType } },
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const categoryCodes = await categoryCodeRepo.search(searchConditions);

            res.json(categoryCodes.map((c) => {
                return {
                    ...c,
                    identifier: c.codeValue,
                    name: (<any>c.name).ja
                };
            }));
        } catch (error) {
            next(error);
        }
    }
);

serviceTypesRouter.get(
    '/:id',
    permitScopes(['admin', 'serviceTypes', 'serviceTypes.read-only']),
    validator,
    async (req, res, next) => {
        try {
            // const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
            // const serviceType = await serviceTypeRepo.findById({ id: req.params.id });

            // res.json(serviceType);

            const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);

            const categoryCode = await categoryCodeRepo.findById({ id: req.params.id });

            res.json({
                ...categoryCode,
                identifier: categoryCode.codeValue,
                name: (<any>categoryCode.name).ja
            });
        } catch (error) {
            next(error);
        }
    }
);

serviceTypesRouter.put(
    '/:id',
    permitScopes(['admin']),
    ...[
        body('project')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('project.id')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
            .isString()
    ],
    validator,
    async (req, res, next) => {
        try {
            const project: chevre.factory.project.IProject = { id: req.body.project.id, typeOf: 'Project' };

            // const serviceType: chevre.factory.serviceType.IServiceType = {
            //     ...req.body,
            //     id: req.params.id
            // };
            // const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
            // await serviceTypeRepo.save(serviceType);

            const categoryCode: chevre.factory.categoryCode.ICategoryCode = {
                ...req.body,
                typeOf: 'CategoryCode',
                inCodeSet: {
                    typeOf: 'CategoryCodeSet',
                    identifier: chevre.factory.categoryCode.CategorySetIdentifier.ServiceType
                },
                name: (typeof req.body.name === 'string')
                    ? { ja: req.body.name }
                    : req.body.name,
                project: project
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

serviceTypesRouter.delete(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            // const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
            // await serviceTypeRepo.deleteById({
            //     id: req.params.id
            // });

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

export default serviceTypesRouter;
