/**
 * 所有権ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
// import { ParamsDictionary } from 'express-serve-static-core';
import { body, query } from 'express-validator';
import { CREATED, NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const ownershipInfosRouter = Router();

/**
 * 所有権作成
 * 識別子に対して冪等性を確保
 */
ownershipInfosRouter.post(
    '/saveByIdentifier',
    permitScopes([]),
    ...[
        body('project.id')
            .not()
            .isEmpty()
            .isString(),
        body('identifier')
            .not()
            .isEmpty()
            .isString(),
        body('ownedBy')
            .not()
            .isEmpty(),
        body('ownedFrom')
            .not()
            .isEmpty()
            .isISO8601()
            .toDate(),
        body('ownedThrough')
            .optional()
            .isISO8601()
            .toDate(),
        body('typeOfGood')
            .not()
            .isEmpty()
    ],
    validator,
    async (req, res, next) => {
        try {
            const now = new Date();

            const ownershipInfoRepo = new chevre.repository.OwnershipInfo(mongoose.connection);

            const ownershipInfo = await ownershipInfoRepo.saveByIdentifier({
                id: '',
                identifier: req.body.identifier,
                ownedBy: req.body.ownedBy,
                ownedFrom: req.body.ownedFrom,
                project: { typeOf: chevre.factory.organizationType.Project, id: req.project.id },
                typeOf: 'OwnershipInfo',
                typeOfGood: req.body.typeOfGood,
                ...(req.body.ownedThrough instanceof Date) ? { ownedThrough: req.body.ownedThrough } : undefined,
                ...(req.body.acquiredFrom !== undefined && req.body.acquiredFrom !== null)
                    ? { acquiredFrom: req.body.acquiredFrom }
                    : undefined
            });

            try {
                // 不要な所有権を削除
                await ownershipInfoRepo.ownershipInfoModel.deleteMany({
                    'project.id': { $eq: req.project.id },
                    // 1年以上前に所有したもの
                    ownedFrom: {
                        $lt: moment(now)
                            // tslint:disable-next-line:no-magic-numbers
                            .add(-12, 'months')
                            .toDate()
                    },
                    // 所有期限切れのもの(ownedThroughの存在しないものは削除してはいけない)
                    ownedThrough: { $exists: true, $lt: now }
                })
                    .exec();
            } catch (error) {
                console.error('ownershipInfoRepo.ownershipInfoModel.deleteMany throws', error);
            }

            res.status(CREATED)
                .json(ownershipInfo);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 所有権検索
 */
ownershipInfosRouter.get(
    '',
    permitScopes([]),
    ...[
        query('project.id.$eq')
            .not()
            .isEmpty()
            .isString(),
        query('ownedFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('ownedThrough')
            .optional()
            .isISO8601()
            .toDate(),
        query('ownedFromGte')
            .optional()
            .isISO8601()
            .toDate(),
        query('ownedFromLte')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const accountRepo = new chevre.repository.Account(mongoose.connection);
            const ownershipInfoRepo = new chevre.repository.OwnershipInfo(mongoose.connection);

            // const typeOfGood = (req.query.typeOfGood !== undefined && req.query.typeOfGood !== null) ? req.query.typeOfGood : {};
            let ownershipInfos: chevre.factory.ownershipInfo.IOwnershipInfo<chevre.factory.ownershipInfo.IGoodWithDetail>[]
                | chevre.factory.ownershipInfo.IOwnershipInfo<chevre.factory.ownershipInfo.IGood>[];

            const searchConditions: chevre.factory.ownershipInfo.ISearchConditions = {
                ...req.query,
                project: { id: { $eq: req.project.id } },
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            ownershipInfos = await ownershipInfoRepo.search(searchConditions);

            // typeOfGoodの詳細指定があればそちらも取得する
            const includeGoodWithDetails = req.query.includeGoodWithDetails === '1';
            if (includeGoodWithDetails) {
                const productType = searchConditions.typeOfGood?.issuedThrough?.typeOf?.$eq;
                switch (productType) {
                    case chevre.factory.product.ProductType.PaymentCard:
                        // 口座詳細取得
                        const accountNumbers = ownershipInfos.map(
                            (o) => (<chevre.factory.ownershipInfo.IAccount>o.typeOfGood).accountNumber
                        );
                        if (accountNumbers.length > 0) {
                            const accounts = await accountRepo.search({
                                project: { id: { $eq: req.project.id } },
                                accountNumbers: accountNumbers
                            });

                            ownershipInfos = ownershipInfos.map((o) => {
                                const account = accounts.find(
                                    (a) => a.accountNumber === (<chevre.factory.ownershipInfo.IAccount>o.typeOfGood).accountNumber
                                );
                                // if (account === undefined) {
                                //     throw new factory.errors.NotFound('Account');
                                // }

                                return {
                                    ...o,
                                    ...(account !== undefined) ? { typeOfGood: account } : undefined
                                };
                            });
                        }

                    default:
                }
            }

            const countDocuments = req.query.countDocuments === '1';
            if (countDocuments) {
                const totalCount = await ownershipInfoRepo.count(searchConditions);
                res.set('X-Total-Count', totalCount.toString());
            }

            res.json(ownershipInfos);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 所有権変更
 */
ownershipInfosRouter.put(
    '/updateByIdentifier',
    permitScopes([]),
    ...[
        body('project.id')
            .not()
            .isEmpty()
            .isString(),
        body('identifier')
            .not()
            .isEmpty()
            .isString(),
        // body('ownedBy')
        //     .not()
        //     .isEmpty(),
        body('ownedThrough')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const ownershipInfoRepo = new chevre.repository.OwnershipInfo(mongoose.connection);

            if (req.body.ownedThrough instanceof Date) {
                await ownershipInfoRepo.ownershipInfoModel.findOneAndUpdate(
                    {
                        'project.id': {
                            // $exists: true,
                            $eq: req.project.id
                        },
                        identifier: req.body.identifier
                    },
                    { ownedThrough: req.body.ownedThrough },
                    { new: true }
                )
                    .select({ __v: 0, createdAt: 0, updatedAt: 0 })
                    .exec();
                // 存在しない場合はいったん保留
                // if (doc !== null) {
                //     throw new chevre.factory.errors.NotFound(ownershipInfoRepo.ownershipInfoModel.modelName);
                // }
            }

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default ownershipInfosRouter;
