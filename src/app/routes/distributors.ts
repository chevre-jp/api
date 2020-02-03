/**
 * 配給ルーター
 * カテゴリーコードルーターのエイリアス
 * @deprecated Use categoryCode router
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
    async (req, res, next) => {
        try {
            // const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
            // const distributions = await distributionRepo.getDistributions();

            // res.json(distributions.map((d) => {
            //     return {
            //         ...d,
            //         codeValue: d.id,
            //         name: (typeof d.name === 'string')
            //             ? d.name
            //             : (d.name !== undefined && d.name !== null) ? (<any>d.name).ja : undefined
            //     };
            // }));

            const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);

            const searchConditions: chevre.factory.categoryCode.ISearchConditions = {
                ...req.query,
                ...(typeof req.query.name === 'string' && req.query.name.length > 0)
                    ? { name: { $regex: req.query.name } }
                    : undefined,
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType } },
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const categoryCodes = await categoryCodeRepo.search(searchConditions);

            res.json(categoryCodes.map((c) => {
                return {
                    ...c,
                    name: (<any>c.name).ja
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
            // const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
            // const searchConditions: chevre.factory.distributor.ISearchConditions = {
            //     ...req.query,
            //     // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            //     limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
            //     page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            // };

            // const distributions = await distributionRepo.searchDistributions(searchConditions);

            // res.json(distributions.map((d) => {
            //     return {
            //         ...d,
            //         codeValue: d.id,
            //         name: (typeof d.name === 'string')
            //             ? d.name
            //             : (d.name !== undefined && d.name !== null) ? (<any>d.name).ja : undefined
            //     };
            // }));

            const categoryCodeRepo = new chevre.repository.CategoryCode(mongoose.connection);

            const searchConditions: chevre.factory.categoryCode.ISearchConditions = {
                ...req.query,
                ...(typeof req.query.name === 'string' && req.query.name.length > 0)
                    ? { name: { $regex: req.query.name } }
                    : undefined,
                inCodeSet: { identifier: { $eq: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType } },
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const categoryCodes = await categoryCodeRepo.search(searchConditions);

            res.json(categoryCodes.map((c) => {
                return {
                    ...c,
                    name: (<any>c.name).ja
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
            // const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
            // await distributionRepo.updateDistribution(<any>{
            //     id: req.params.id,
            //     codeValue: req.params.id,
            //     name: (typeof req.body.name === 'string')
            //         ? { ja: req.body.name }
            //         : req.body.name
            // });

            const project: chevre.factory.project.IProject = { id: req.body.project.id, typeOf: 'Project' };

            const categoryCode: chevre.factory.categoryCode.ICategoryCode = {
                codeValue: req.params.id,
                typeOf: 'CategoryCode',
                inCodeSet: {
                    typeOf: 'CategoryCodeSet',
                    identifier: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType
                },
                name: (typeof req.body.name === 'string')
                    ? { ja: req.body.name }
                    : req.body.name,
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
            // const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
            // const distributor = await distributionRepo.createDistribution(<any>{
            //     id: req.body.id,
            //     codeValue: req.params.id,
            //     name: (typeof req.body.name === 'string')
            //         ? { ja: req.body.name }
            //         : req.body.name
            // });

            // res.status(CREATED)
            //     .json({
            //         ...distributor,
            //         codeValue: distributor.id,
            //         name: (typeof distributor.name === 'string')
            //             ? distributor.name
            //             : (distributor.name !== undefined && distributor.name !== null) ? (<any>distributor.name).ja : undefined
            //     });

            const project: chevre.factory.project.IProject = { id: req.body.project.id, typeOf: 'Project' };

            let categoryCode: chevre.factory.categoryCode.ICategoryCode = {
                codeValue: req.body.id,
                typeOf: 'CategoryCode',
                inCodeSet: {
                    typeOf: 'CategoryCodeSet',
                    identifier: chevre.factory.categoryCode.CategorySetIdentifier.DistributorType
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
                    name: (<any>categoryCode.name).ja
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
            // const distributionRepo = new chevre.repository.Distributions(mongoose.connection);
            // await distributionRepo.deleteById({
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

export default distributorsRouter;
