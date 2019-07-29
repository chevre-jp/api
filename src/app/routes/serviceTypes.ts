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
            .withMessage((_, __) => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: 'Project' };

            let serviceType: chevre.factory.serviceType.IServiceType = {
                ...req.body,
                typeOf: 'ServiceType',
                id: '',
                project: project
            };

            const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
            serviceType = await serviceTypeRepo.save(serviceType);

            res.status(CREATED)
                .json(serviceType);
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
            const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
            const searchCoinditions: chevre.factory.serviceType.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };
            const totalCount = await serviceTypeRepo.count(searchCoinditions);
            const serviceTypes = await serviceTypeRepo.search(searchCoinditions);

            res.set('X-Total-Count', totalCount.toString())
                .json(serviceTypes);
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
            const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
            const serviceType = await serviceTypeRepo.findById({ id: req.params.id });

            res.json(serviceType);
        } catch (error) {
            next(error);
        }
    }
);

serviceTypesRouter.put(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const serviceType: chevre.factory.serviceType.IServiceType = {
                ...req.body,
                id: req.params.id
            };
            const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
            await serviceTypeRepo.save(serviceType);

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
            const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
            await serviceTypeRepo.deleteById({
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
