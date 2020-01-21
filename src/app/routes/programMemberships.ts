/**
 * メンバーシッププログラムルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body } from 'express-validator/check';
import { CREATED } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const programMembershipsRouter = Router();
programMembershipsRouter.use(authentication);

/**
 * メンバーシッププログラム作成
 */
programMembershipsRouter.post(
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
            const programMembershipRepo = new chevre.repository.ProgramMembership(mongoose.connection);

            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: 'Project' };

            const doc = await programMembershipRepo.programMembershipModel.create({ ...req.body, project: project });

            res.status(CREATED)
                .json(doc.toObject());
        } catch (error) {
            next(error);
        }
    }
);

/**
 * メンバーシッププログラム検索
 */
programMembershipsRouter.get(
    '',
    permitScopes(['admin']),
    ...[
    ],
    validator,
    async (req, res, next) => {
        try {
            const programMembershipRepo = new chevre.repository.ProgramMembership(mongoose.connection);
            // const searchCoinditions = {
            //     ...req.query,
            //     // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            //     limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
            //     page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            // };

            // const totalCount = await programMembershipRepo.count(searchCoinditions);
            // const programMemberships = await programMembershipRepo.search(searchCoinditions);

            const searchConditions: any = {
                ...(req.query.project !== undefined && req.query.project !== null
                    && req.query.project.id !== undefined && req.query.project.id !== null
                    && typeof req.query.project.id.$eq === 'string')
                    ? {
                        'project.id': {
                            $exists: true,
                            $eq: req.query.project.id.$eq
                        }
                    }
                    : {}
            };
            const totalCount = await programMembershipRepo.programMembershipModel.countDocuments(searchConditions)
                .exec();
            const programMemberships = await programMembershipRepo.programMembershipModel.find(searchConditions)
                .exec()
                .then((docs) => docs.map((doc) => doc.toObject()));

            res.set('X-Total-Count', totalCount.toString())
                .json(programMemberships);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * メンバーシッププログラム検索
 */
programMembershipsRouter.get(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const programMembershipRepo = new chevre.repository.ProgramMembership(mongoose.connection);

            const doc = await programMembershipRepo.programMembershipModel.findById({ _id: req.params.id })
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound('ProgramMembership');
            }

            res.json(doc.toObject());
        } catch (error) {
            next(error);
        }
    }
);

/**
 * メンバーシッププログラムに対するオファー検索
 */
programMembershipsRouter.get(
    '/:id/offers',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const programMembershipRepo = new chevre.repository.ProgramMembership(mongoose.connection);

            // メンバーシッププログラム検索
            const programMembershipDoc = await programMembershipRepo.programMembershipModel.findById({ _id: req.params.id })
                .exec();
            if (programMembershipDoc === null) {
                throw new chevre.factory.errors.NotFound('ProgramMembership');
            }
            const programMembership = programMembershipDoc.toObject();

            // オファーカタログ検索
            const offerCatalog = await offerRepo.findOfferCatalogById({ id: programMembership.hasOfferCatalog.id });

            // オファー検索
            const offers = await offerRepo.offerModel.find(
                { _id: { $in: (<any[]>offerCatalog.itemListElement).map((e: any) => e.id) } },
                {
                    __v: 0,
                    createdAt: 0,
                    updatedAt: 0
                }
            )
                .exec()
                .then((docs) => docs.map((doc) => doc.toObject()));

            const programMembershipOffers = offers
                .map((o) => {
                    const unitSpec = o.priceSpecification;

                    const compoundPriceSpecification: chevre.factory.compoundPriceSpecification.IPriceSpecification<any> = {
                        project: programMembership.project,
                        typeOf: chevre.factory.priceSpecificationType.CompoundPriceSpecification,
                        priceCurrency: chevre.factory.priceCurrency.JPY,
                        valueAddedTaxIncluded: true,
                        priceComponent: [
                            unitSpec
                        ]
                    };

                    return {
                        ...o,
                        priceSpecification: compoundPriceSpecification
                    };
                });

            res.json(programMembershipOffers);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * メンバーシッププログラム更新
 */
// programMembershipsRouter.put(
//     '/:id',
//     permitScopes(['admin']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const programMembershipRepo = new chevre.repository.ProgramMembership(mongoose.connection);
//             await programMembershipRepo.save(req.body);

//             res.status(NO_CONTENT)
//                 .end();
//         } catch (error) {
//             next(error);
//         }
//     }
// );

/**
 * メンバーシッププログラム削除
 */
// programMembershipsRouter.delete(
//     '/:id',
//     permitScopes(['admin']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const programMembershipRepo = new chevre.repository.ProgramMembership(mongoose.connection);
//             await programMembershipRepo.deleteById({ id: req.params.id });

//             res.status(NO_CONTENT)
//                 .end();
//         } catch (error) {
//             next(error);
//         }
//     }
// );

export default programMembershipsRouter;
