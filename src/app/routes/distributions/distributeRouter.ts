/**
 * 配給ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import * as mongoose from 'mongoose';

import { CREATED, NO_CONTENT } from 'http-status';
import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const distributeRouter = Router();
distributeRouter.use(authentication);

distributeRouter.get(
    '/list',
    permitScopes(['admin']),
    validator,
    async (_, res, next) => {
        try {
            const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
            const distributions = await distributionRepo.getDistributions();
            res.json(distributions);
        } catch (error) {
            next(error);
        }
    }
);

distributeRouter.get(
    '/search',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
            const searchCoinditions: chevre.factory.distributions.distribute.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };
            const totalCount = await distributionRepo.countDistributions(searchCoinditions);
            const distributions = await distributionRepo.searchDistributions(searchCoinditions);
            res.set('X-Total-Count', totalCount.toString());
            res.json(distributions);
        } catch (error) {
            next(error);
        }
    }
);

distributeRouter.put(
    '/:id',
    permitScopes(['admin']),
    (req, _, next) => {
        req.checkBody('name').exists().withMessage('name is required');
        next();
    },
    validator,
    async (req, res, next) => {
        try {
            const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
            await distributionRepo.updateDistribution({
                id: req.params.id,
                name: req.body.name
            });
            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);

distributeRouter.post(
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
            const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
            const distributions = await distributionRepo.createDistribution({
                id: req.body.id,
                name: req.body.name
            });
            res.status(CREATED).json(distributions);
        } catch (error) {
            next(error);
        }
    }
);

distributeRouter.delete(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
            await distributionRepo.deleteById({
                id: req.params.id
            });
            res.status(NO_CONTENT).end();
        } catch (error) {
            next(error);
        }
    }
);

export default distributeRouter;
