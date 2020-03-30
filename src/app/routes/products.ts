/**
 * プロダクトルーター
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

const productsRouter = Router();
productsRouter.use(authentication);

/**
 * プロダクト作成
 */
productsRouter.post(
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
            const productRepo = new chevre.repository.Product(mongoose.connection);

            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: 'Project' };

            const doc = await productRepo.productModel.create({ ...req.body, project: project });

            res.status(CREATED)
                .json(doc.toObject());
        } catch (error) {
            next(error);
        }
    }
);

/**
 * プロダクト検索
 */
productsRouter.get(
    '',
    permitScopes(['admin']),
    ...[],
    validator,
    async (req, res, next) => {
        try {
            const productRepo = new chevre.repository.Product(mongoose.connection);

            const searchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const products = await productRepo.search(searchConditions);

            res.json(products);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * プロダクト検索
 */
productsRouter.get(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const productRepo = new chevre.repository.Product(mongoose.connection);

            const product = await productRepo.findById({ id: req.params.id });

            res.json(product);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * プロダクトに対するオファー検索
 */
productsRouter.get(
    '/:id/offers',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
            const productRepo = new chevre.repository.Product(mongoose.connection);

            // プロダクト検索
            const product = await productRepo.findById({ id: req.params.id });

            // オファーカタログ検索
            const offerCatalog = await offerCatalogRepo.findById({ id: product.hasOfferCatalog.id });

            // オファー検索
            const offers = await offerRepo.search({
                id: { $in: offerCatalog.itemListElement.map((e) => e.id) }
            });

            const productOffers = offers
                .map((o) => {
                    const unitSpec = o.priceSpecification;

                    const compoundPriceSpecification: chevre.factory.compoundPriceSpecification.IPriceSpecification<any> = {
                        project: product.project,
                        typeOf: chevre.factory.priceSpecificationType.CompoundPriceSpecification,
                        priceCurrency: chevre.factory.priceCurrency.JPY,
                        valueAddedTaxIncluded: true,
                        priceComponent: [
                            ...(unitSpec !== undefined) ? [unitSpec] : []
                        ]
                    };

                    return {
                        ...o,
                        priceSpecification: compoundPriceSpecification
                    };
                });

            res.json(productOffers);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * プロダクト更新
 */
productsRouter.put(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const project: chevre.factory.project.IProject = { id: req.body.project.id, typeOf: 'Project' };

            const product: any = {
                ...req.body,
                project: project
            };
            delete product.id;

            const productRepo = new chevre.repository.Product(mongoose.connection);
            await productRepo.productModel.findOneAndUpdate(
                { _id: req.params.id },
                product
            )
                .exec();

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

/**
 * プロダクト削除
 */
productsRouter.delete(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const productRepo = new chevre.repository.Product(mongoose.connection);

            await productRepo.deleteById({ id: req.params.id });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default productsRouter;
