/**
 * 興行区分ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
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
    validator,
    async (req, res, next) => {
        try {
            const serviceType: chevre.factory.serviceType.IServiceType = {
                ...req.body
            };
            const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
            await serviceTypeRepo.save(serviceType);
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
            res.set('X-Total-Count', totalCount.toString());
            res.json(serviceTypes);
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
                ...req.body
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

export default serviceTypesRouter;
