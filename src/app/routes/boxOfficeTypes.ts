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
            const boxOfficeTypeRepo = new chevre.repository.BoxOfficeType(mongoose.connection);
            const boxOfficeTypes = await boxOfficeTypeRepo.getBoxOfficeTypeList();
            res.json(boxOfficeTypes);
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
            const boxOfficeTypeRepo = new chevre.repository.BoxOfficeType(mongoose.connection);
            const searchCondition = {
                id: req.query.id,
                name: req.query.name
            };
            const totalCount = await boxOfficeTypeRepo.countBoxOfficeType(searchCondition);
            const boxOfficeType = await boxOfficeTypeRepo.searchBoxOfficeType(searchCondition);
            res.set('X-Total-Count', totalCount.toString());
            res.json(boxOfficeType);
        } catch (error) {
            next(error);
        }
    }
);

boxOfficeTypesRouter.put(
    '/:id',
    permitScopes(['admin']),
    (req, _, next) => {
        req.checkBody('name').exists().withMessage('name is required');
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const boxOfficeTypeRepo = new chevre.repository.BoxOfficeType(mongoose.connection);
            await boxOfficeTypeRepo.updateBoxOfficeType({
                id: req.params.id,
                name: req.body.name
            });
            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);

boxOfficeTypesRouter.post(
    '/add',
    permitScopes(['admin']),
    (req, _, next) => {
        req.checkBody('id').exists().withMessage('id is required');
        req.checkBody('name').exists().withMessage('name is required');
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const boxOfficeTypeRepo = new chevre.repository.BoxOfficeType(mongoose.connection);
            const boxOfficeType = await boxOfficeTypeRepo.createBoxOfficeType({
                id: req.body.id,
                name: req.body.name
            });
            res.status(CREATED).json(boxOfficeType);
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
            const boxOfficeTypeRepo = new chevre.repository.BoxOfficeType(mongoose.connection);
            await boxOfficeTypeRepo.deleteById({
                id: req.params.id
            });
            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);
export default boxOfficeTypesRouter;
