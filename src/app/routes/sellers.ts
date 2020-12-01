/**
 * 販売者ルーター
 */
import * as chevre from '@chevre/domain';
import { RequestHandler, Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, query } from 'express-validator';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

/**
 * 販売者に対するバリデーション
 */
const validations: RequestHandler[] = [
    body('project.id')
        .not()
        .isEmpty()
        .withMessage(() => 'Required'),
    body('typeOf')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    body('name.ja')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    body('name.en')
        .not()
        .isEmpty()
        .withMessage(() => 'required'),
    body('url')
        .optional()
        .isURL(),
    body('paymentAccepted')
        .optional()
        .isArray(),
    body('areaServed')
        .optional()
        .isArray(),
    body('hasMerchantReturnPolicy')
        .optional()
        .isArray(),
    body('paymentAccepted')
        .optional()
        .isArray(),
    body('additionalProperty')
        .optional()
        .isArray()
];

const sellersRouter = Router();

sellersRouter.use(authentication);

/**
 * 販売者作成
 */
sellersRouter.post(
    '',
    permitScopes(['admin']),
    ...validations,
    validator,
    async (req, res, next) => {
        try {
            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: chevre.factory.organizationType.Project };

            const attributes: chevre.factory.seller.ISeller = {
                ...req.body,
                project: project
            };

            const sellerRepo = new chevre.repository.Seller(mongoose.connection);
            const seller = await sellerRepo.save({ attributes: attributes });

            res.status(CREATED)
                .json(seller);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 販売者検索
 */
sellersRouter.get(
    '',
    permitScopes(['admin']),
    ...[
        query('$projection.*')
            .toInt()
    ],
    validator,
    async (req, res, next) => {
        try {
            const searchConditions: chevre.factory.seller.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const sellerRepo = new chevre.repository.Seller(mongoose.connection);
            let sellers = await sellerRepo.search(
                searchConditions,
                (req.query.$projection !== undefined && req.query.$projection !== null) ? { ...req.query.$projection } : undefined
            );

            // GMOのショップIDだけ補完する(互換性維持対応として)
            const checkingPaymentMethodType = chevre.factory.paymentMethodType.CreditCard;
            if (sellers.length > 0) {
                // クレジットカード決済サービスを取得
                const productRepo = new chevre.repository.Product(mongoose.connection);
                const paymentServices = <chevre.factory.service.paymentService.IService[]>await productRepo.search({
                    limit: 1,
                    project: { id: { $eq: sellers[0].project.id } },
                    typeOf: { $eq: chevre.factory.service.paymentService.PaymentServiceType.CreditCard },
                    serviceOutput: { typeOf: { $eq: checkingPaymentMethodType } }
                });

                // 存在すれば、ショップIDをpaymentAcceptedに追加
                if (paymentServices.length > 0) {
                    const paymentService = paymentServices[0];
                    sellers = sellers.map((seller) => {
                        if (Array.isArray(seller.paymentAccepted)) {
                            const shopId = paymentService.provider?.find((p) => p.id === seller.id)?.credentials?.shopId;

                            if (typeof shopId === 'string') {
                                seller.paymentAccepted.forEach((payment) => {
                                    if (payment.paymentMethodType === checkingPaymentMethodType) {
                                        (<any>payment).gmoInfo = { shopId };
                                    }
                                });
                            }
                        }

                        return seller;
                    });
                }
            }

            res.json(sellers);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * IDで販売者検索
 */
// tslint:disable-next-line:use-default-type-parameter
sellersRouter.get<ParamsDictionary>(
    '/:id',
    permitScopes(['admin']),
    ...[
        query('$projection.*')
            .toInt()
    ],
    validator,
    async (req, res, next) => {
        try {
            const sellerRepo = new chevre.repository.Seller(mongoose.connection);
            const seller = await sellerRepo.findById(
                { id: req.params.id },
                (req.query.$projection !== undefined && req.query.$projection !== null) ? { ...req.query.$projection } : undefined
            );

            // GMOのショップIDだけ補完する(互換性維持対応として)
            const checkingPaymentMethodType = chevre.factory.paymentMethodType.CreditCard;
            // クレジットカード決済サービスを取得
            const productRepo = new chevre.repository.Product(mongoose.connection);
            const paymentServices = <chevre.factory.service.paymentService.IService[]>await productRepo.search({
                limit: 1,
                project: { id: { $eq: seller.project.id } },
                typeOf: { $eq: chevre.factory.service.paymentService.PaymentServiceType.CreditCard },
                serviceOutput: { typeOf: { $eq: checkingPaymentMethodType } }
            });

            // 存在すれば、ショップIDをpaymentAcceptedに追加
            if (paymentServices.length > 0) {
                const paymentService = paymentServices[0];
                if (Array.isArray(seller.paymentAccepted)) {
                    const shopId = paymentService.provider?.find((p) => p.id === seller.id)?.credentials?.shopId;

                    if (typeof shopId === 'string') {
                        seller.paymentAccepted.forEach((payment) => {
                            if (payment.paymentMethodType === checkingPaymentMethodType) {
                                (<any>payment).gmoInfo = { shopId };
                            }
                        });
                    }
                }
            }

            res.json(seller);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 販売者更新
 */
// tslint:disable-next-line:use-default-type-parameter
sellersRouter.put<ParamsDictionary>(
    '/:id',
    permitScopes(['admin']),
    ...validations,
    validator,
    async (req, res, next) => {
        try {
            const attributes: chevre.factory.seller.ISeller = {
                ...req.body
            };

            const sellerRepo = new chevre.repository.Seller(mongoose.connection);
            await sellerRepo.save({ id: req.params.id, attributes: attributes });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 販売者削除
 */
sellersRouter.delete(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const sellerRepo = new chevre.repository.Seller(mongoose.connection);
            await sellerRepo.deleteById({
                id: req.params.id
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default sellersRouter;
