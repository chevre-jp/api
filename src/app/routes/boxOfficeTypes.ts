/**
 * 興行区分ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import * as mongoose from 'mongoose';

import { CREATED, NO_CONTENT } from 'http-status';
import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const boxOfficeTypesRouter = Router();
boxOfficeTypesRouter.use(authentication);
boxOfficeTypesRouter.get(
    '/getBoxOfficeTypeList',
    permitScopes(['admin', 'boxOfficeTypes', 'boxOfficeTypes.read-only']),
    validator,
    async (__, res, next) => {
        try {
            const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
            const searchCoinditions: chevre.factory.serviceType.ISearchConditions = {
                sort: <any>{ _id: chevre.factory.sortType.Ascending }
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
boxOfficeTypesRouter.get(
    '/search',
    permitScopes(['admin']),
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

boxOfficeTypesRouter.put(
    '/:id',
    permitScopes(['admin']),
    (req, _, next) => {
        req.checkBody('name')
            .exists()
            .withMessage('Required');
        next();
    },
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

boxOfficeTypesRouter.post(
    '/add',
    permitScopes(['admin']),
    (req, _, next) => {
        req.checkBody('id')
            .exists()
            .withMessage('Required');
        req.checkBody('name')
            .exists()
            .withMessage('Required');
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const serviceType: chevre.factory.serviceType.IServiceType = req.body;
            const serviceTypeRepo = new chevre.repository.ServiceType(mongoose.connection);
            await serviceTypeRepo.save(serviceType);
            res.status(CREATED)
                .json(serviceType);
        } catch (error) {
            next(error);
        }
    }
);

boxOfficeTypesRouter.delete(
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
export default boxOfficeTypesRouter;
