/**
 * 配給ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import * as mongoose from 'mongoose';

import { CREATED, NO_CONTENT } from 'http-status';
import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const distributorsRouter = Router();
distributorsRouter.use(authentication);

distributorsRouter.get(
    '/list',
    permitScopes(['admin']),
    validator,
    async (_, res, next) => {
        try {
            const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
            const distributions = await distributionRepo.getDistributions();
            res.json(distributions.map((d) => {
                return {
                    ...d,
                    distributorType: d.id
                };
            }));
        } catch (error) {
            next(error);
        }
    }
);

distributorsRouter.get(
    '/search',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
            const searchConditions: chevre.factory.distributor.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const distributions = await distributionRepo.searchDistributions(searchConditions);
            res.json(distributions.map((d) => {
                return {
                    ...d,
                    distributorType: d.id,
                    name: (typeof d.name === 'string')
                        ? d.name
                        : (d.name !== undefined && d.name !== null) ? (<any>d.name).ja : undefined
                };
            }));
        } catch (error) {
            next(error);
        }
    }
);

distributorsRouter.put(
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
            const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
            await distributionRepo.updateDistribution({
                id: req.params.id,
                name: req.body.name
            });
            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

distributorsRouter.post(
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
            const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
            const distributor = await distributionRepo.createDistribution({
                id: req.body.id,
                name: req.body.name
            });
            res.status(CREATED)
                .json({
                    ...distributor,
                    distributorType: distributor.id,
                    name: (typeof distributor.name === 'string')
                        ? distributor.name
                        : (distributor.name !== undefined && distributor.name !== null) ? (<any>distributor.name).ja : undefined
                });
        } catch (error) {
            next(error);
        }
    }
);

distributorsRouter.delete(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
            await distributionRepo.deleteById({
                id: req.params.id
            });
            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default distributorsRouter;
