/**
 * プロダクトルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, query } from 'express-validator';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const productsRouter = Router();

/**
 * プロダクト作成
 */
productsRouter.post(
    '',
    permitScopes(['products.*']),
    ...[
        body('offers')
            .optional()
            .isArray(),
        body('offers.*.validFrom')
            .optional()
            .isISO8601()
            .toDate(),
        body('offers.*.validThrough')
            .optional()
            .isISO8601()
            .toDate(),
        body('offers.*.availabilityStarts')
            .optional()
            .isISO8601()
            .toDate(),
        body('offers.*.availabilityEnds')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const productRepo = new chevre.repository.Product(mongoose.connection);

            const project: chevre.factory.project.IProject = { id: req.project.id, typeOf: chevre.factory.organizationType.Project };

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
    permitScopes(['products.*', 'products.read']),
    ...[
        query('$projection.*')
            .toInt(),
        query('offers.$elemMatch.validFrom.$gte')
            .optional()
            .isISO8601()
            .toDate(),
        query('offers.$elemMatch.validFrom.$lte')
            .optional()
            .isISO8601()
            .toDate(),
        query('offers.$elemMatch.validThrough.$gte')
            .optional()
            .isISO8601()
            .toDate(),
        query('offers.$elemMatch.validThrough.$lte')
            .optional()
            .isISO8601()
            .toDate(),
        query('offers.$elemMatch.availabilityEnds.$gte')
            .optional()
            .isISO8601()
            .toDate(),
        query('offers.$elemMatch.availabilityEnds.$lte')
            .optional()
            .isISO8601()
            .toDate(),
        query('offers.$elemMatch.availabilityStarts.$gte')
            .optional()
            .isISO8601()
            .toDate(),
        query('offers.$elemMatch.availabilityStarts.$lte')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const productRepo = new chevre.repository.Product(mongoose.connection);

            const searchConditions: chevre.factory.product.ISearchConditions = {
                ...req.query,
                project: { id: { $eq: req.project.id } },
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const $projection: any = {
                ...req.query.$projection,
                // defaultで隠蔽
                availableChannel: 0,
                // 'availableChannel.credentials': 0,
                // 'availableChannel.serviceUrl': 0,
                'provider.credentials.shopPass': 0,
                'provider.credentials.kgygishCd': 0,
                'provider.credentials.stCd': 0
            };
            const products = await productRepo.search(
                searchConditions,
                $projection
            );

            res.json(products);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * プロダクト検索
 */
// tslint:disable-next-line:use-default-type-parameter
productsRouter.get<ParamsDictionary>(
    '/:id',
    permitScopes(['products.*']),
    ...[
        query('$projection.*')
            .toInt()
    ],
    validator,
    async (req, res, next) => {
        try {
            const productRepo = new chevre.repository.Product(mongoose.connection);

            const product = await productRepo.findById(
                { id: req.params.id },
                (req.query.$projection !== undefined && req.query.$projection !== null) ? { ...req.query.$projection } : undefined
            );

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
    permitScopes(['products.*', 'products.read']),
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const offerCatalogRepo = new chevre.repository.OfferCatalog(mongoose.connection);
            const productRepo = new chevre.repository.Product(mongoose.connection);

            const offers = await chevre.service.offer.searchProductOffers({
                itemOffered: { id: req.params.id }
            })({
                offer: offerRepo,
                offerCatalog: offerCatalogRepo,
                product: productRepo
            });

            res.json(offers);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * プロダクト更新
 */
// tslint:disable-next-line:use-default-type-parameter
productsRouter.put<ParamsDictionary>(
    '/:id',
    permitScopes(['products.*']),
    ...[
        body('offers')
            .optional()
            .isArray(),
        body('offers.*.validFrom')
            .optional()
            .isISO8601()
            .toDate(),
        body('offers.*.validThrough')
            .optional()
            .isISO8601()
            .toDate(),
        body('offers.*.availabilityStarts')
            .optional()
            .isISO8601()
            .toDate(),
        body('offers.*.availabilityEnds')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const project: chevre.factory.project.IProject = { id: req.body.project.id, typeOf: chevre.factory.organizationType.Project };

            const product: chevre.factory.product.IProduct = {
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
    permitScopes(['products.*']),
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
