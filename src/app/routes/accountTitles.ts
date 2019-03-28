/**
 * 勘定科目ルーター
 */
import * as chevre from '@chevre/domain';
import * as createDebug from 'debug';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body } from 'express-validator/check';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const debug = createDebug('chevre-api:router');

const accountTitlesRouter = Router();
accountTitlesRouter.use(authentication);

/**
 * 科目分類追加
 */
accountTitlesRouter.post(
    '/accountTitleCategory',
    permitScopes(['admin']),
    ...[
        body('codeValue')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('name')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const accountTitle: chevre.factory.accountTitle.IAccountTitle = req.body;
            const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
            await accountTitleRepo.accountTitleModel.create(accountTitle);
            res.status(CREATED)
                .json(accountTitle);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 科目分類検索
 */
accountTitlesRouter.get(
    '/accountTitleCategory',
    permitScopes(['admin', 'accountTitles', 'accountTitles.read-only']),
    validator,
    // tslint:disable-next-line:max-func-body-length
    async (req, res, next) => {
        try {
            const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
            const searchCoinditions: chevre.factory.accountTitle.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };
            // const totalCount = await accountTitleRepo.count(searchCoinditions);
            // const accountTitles = await accountTitleRepo.search(searchCoinditions);
            // res.set('X-Total-Count', totalCount.toString());
            // res.json(accountTitles);

            const conditions: any[] = [
                { typeOf: 'AccountTitle' }
            ];
            if (searchCoinditions.codeValue !== undefined) {
                conditions.push({
                    codeValue: {
                        $exists: true,
                        $regex: new RegExp(searchCoinditions.codeValue, 'i')
                    }
                });
            }

            const totalCount = await accountTitleRepo.accountTitleModel.countDocuments(
                { $and: conditions }
            )
                .setOptions({ maxTimeMS: 10000 })
                .exec();

            const query = accountTitleRepo.accountTitleModel.find(
                { $and: conditions },
                {
                    __v: 0,
                    createdAt: 0,
                    updatedAt: 0,
                    hasCategoryCode: 0
                }
            );
            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore else */
            if (searchCoinditions.limit !== undefined && searchCoinditions.page !== undefined) {
                query.limit(searchCoinditions.limit)
                    .skip(searchCoinditions.limit * (searchCoinditions.page - 1));
            }
            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore else */
            if (searchCoinditions.sort !== undefined) {
                query.sort(searchCoinditions.sort);
            }

            const accountTitles = await query.setOptions({ maxTimeMS: 10000 })
                .exec()
                .then((docs) => docs.map((doc) => doc.toObject()));

            res.set('X-Total-Count', totalCount.toString());
            res.json(accountTitles);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 科目分類更新
 */
accountTitlesRouter.put(
    '/accountTitleCategory/:codeValue',
    permitScopes(['admin']),
    ...[
        body('codeValue')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('name')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const accountTitle: chevre.factory.accountTitle.IAccountTitle = { ...req.body, codeValue: req.params.codeValue };
            delete accountTitle.inCodeSet;
            delete accountTitle.hasCategoryCode;

            const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);

            const doc = await accountTitleRepo.accountTitleModel.findOneAndUpdate(
                { codeValue: accountTitle.codeValue },
                accountTitle,
                { new: true }
            )
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound('AccountTitle');
            }

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 科目追加
 */
accountTitlesRouter.post(
    '/accountTitleSet',
    permitScopes(['admin']),
    ...[
        body('codeValue')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('name')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('inCodeSet')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('inCodeSet.codeValue')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const accountTitleCategory: chevre.factory.accountTitle.IAccountTitle = req.body.inCodeSet;
            const accountTitle: chevre.factory.accountTitle.IAccountTitle = req.body;
            delete accountTitle.inCodeSet;

            const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);

            // 科目分類の存在確認
            let doc = await accountTitleRepo.accountTitleModel.findOne(
                { codeValue: accountTitleCategory.codeValue }
            )
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound('AccountTitleCategory');
            }

            debug('creating accountTitleSet', accountTitle);
            doc = await accountTitleRepo.accountTitleModel.findOneAndUpdate(
                {
                    codeValue: accountTitleCategory.codeValue,
                    'hasCategoryCode.codeValue': { $ne: accountTitle.codeValue }
                },
                { $push: { hasCategoryCode: accountTitle } },
                { new: true }
            )
                .exec();
            // 存在しなければ科目コード重複
            if (doc === null) {
                throw new chevre.factory.errors.AlreadyInUse('AccountTitle', ['hasCategoryCode.codeValue']);
            }

            res.status(CREATED)
                .json(accountTitle);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 科目検索
 */
accountTitlesRouter.get(
    '/accountTitleSet',
    permitScopes(['admin', 'accountTitles', 'accountTitles.read-only']),
    validator,
    // tslint:disable-next-line:max-func-body-length
    async (req, res, next) => {
        try {
            const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
            const searchCoinditions: chevre.factory.accountTitle.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };
            // const totalCount = await accountTitleRepo.count(searchCoinditions);
            // const accountTitles = await accountTitleRepo.search(searchCoinditions);
            // res.set('X-Total-Count', totalCount.toString());
            // res.json(accountTitles);

            const matchStages: any[] = [];
            if (searchCoinditions.codeValue !== undefined) {
                matchStages.push({
                    $match: {
                        'hasCategoryCode.codeValue': {
                            $exists: true,
                            $regex: new RegExp(searchCoinditions.codeValue, 'i')
                        }
                    }
                });
            }
            if (searchCoinditions.inCodeSet !== undefined) {
                if (searchCoinditions.inCodeSet.codeValue !== undefined) {
                    matchStages.push({
                        $match: {
                            codeValue: {
                                $exists: true,
                                $regex: new RegExp(searchCoinditions.inCodeSet.codeValue, 'i')
                            }
                        }
                    });
                }
            }

            const totalCountResult = await accountTitleRepo.accountTitleModel.aggregate([
                { $unwind: '$hasCategoryCode' },
                ...matchStages,
                { $count: 'totalCount' }
            ])
                .exec();
            const totalCount = (Array.isArray(totalCountResult) && totalCountResult.length > 0) ? totalCountResult[0].totalCount : 0;

            const aggregate = accountTitleRepo.accountTitleModel.aggregate([
                { $unwind: '$hasCategoryCode' },
                ...matchStages,
                {
                    $project: {
                        _id: 0,
                        codeValue: '$hasCategoryCode.codeValue',
                        name: '$hasCategoryCode.name',
                        inCodeSet: {
                            codeValue: '$codeValue',
                            name: '$name'
                        },
                        inDefinedTermSet: '$hasCategoryCode.inDefinedTermSet',
                        additionalProperty: '$hasCategoryCode.additionalProperty'
                    }
                }
            ]);

            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore else */
            if (searchCoinditions.limit !== undefined && searchCoinditions.page !== undefined) {
                aggregate.limit(searchCoinditions.limit * searchCoinditions.page)
                    .skip(searchCoinditions.limit * (searchCoinditions.page - 1));
            }

            const accountTitles = await aggregate.exec();

            res.set('X-Total-Count', totalCount.toString());
            res.json(accountTitles);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 科目更新
 */
accountTitlesRouter.put(
    '/accountTitleSet/:codeValue',
    permitScopes(['admin']),
    ...[
        body('codeValue')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('name')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const accountTitle: chevre.factory.accountTitle.IAccountTitle = { ...req.body, codeValue: req.params.codeValue };
            delete accountTitle.inCodeSet;
            delete accountTitle.hasCategoryCode;

            const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);

            debug('updating accountTitleSet', accountTitle);
            const doc = await accountTitleRepo.accountTitleModel.findOneAndUpdate(
                { 'hasCategoryCode.codeValue': accountTitle.codeValue },
                {
                    'hasCategoryCode.$.name': accountTitle.name,
                    'hasCategoryCode.$.description': accountTitle.description,
                    'hasCategoryCode.$.inDefinedTermSet': accountTitle.inDefinedTermSet,
                    'hasCategoryCode.$.additionalProperty': accountTitle.additionalProperty
                },
                { new: true }
            )
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound('AccountTitle');
            }

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 細目追加
 */
accountTitlesRouter.post(
    '',
    permitScopes(['admin']),
    ...[
        body('codeValue')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('name')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('inCodeSet')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('inCodeSet.codeValue')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('inCodeSet.inCodeSet')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('inCodeSet.inCodeSet.codeValue')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const accountTitleSet: chevre.factory.accountTitle.IAccountTitle = req.body.inCodeSet;
            const accountTitleCategory: chevre.factory.accountTitle.IAccountTitle = req.body.inCodeSet.inCodeSet;
            const accountTitle: chevre.factory.accountTitle.IAccountTitle = req.body;
            delete accountTitle.inCodeSet;

            const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);

            // 科目の存在確認
            let doc = await accountTitleRepo.accountTitleModel.findOne({
                codeValue: accountTitleCategory.codeValue,
                'hasCategoryCode.codeValue': accountTitleSet.codeValue
            })
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound('AccountTitleSet');
            }

            doc = await accountTitleRepo.accountTitleModel.findOneAndUpdate(
                {
                    codeValue: accountTitleCategory.codeValue,
                    'hasCategoryCode.codeValue': accountTitleSet.codeValue,
                    'hasCategoryCode.hasCategoryCode.codeValue': { $ne: accountTitle.codeValue }
                },
                { $push: { 'hasCategoryCode.$.hasCategoryCode': accountTitle } },
                { new: true }
            )
                .exec();
            // 存在しなければ細目コード重複
            if (doc === null) {
                throw new chevre.factory.errors.AlreadyInUse('AccountTitle', ['hasCategoryCode.hasCategoryCode.codeValue']);
            }

            res.status(CREATED)
                .json(accountTitle);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 細目検索
 */
accountTitlesRouter.get(
    '',
    permitScopes(['admin', 'accountTitles', 'accountTitles.read-only']),
    validator,
    // tslint:disable-next-line:max-func-body-length
    async (req, res, next) => {
        try {
            const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
            const searchCoinditions: chevre.factory.accountTitle.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };
            // const totalCount = await accountTitleRepo.count(searchCoinditions);
            // const accountTitles = await accountTitleRepo.search(searchCoinditions);
            // res.set('X-Total-Count', totalCount.toString());
            // res.json(accountTitles);

            const matchStages: any[] = [];
            if (searchCoinditions.codeValue !== undefined) {
                matchStages.push({
                    $match: {
                        'hasCategoryCode.hasCategoryCode.codeValue': {
                            $exists: true,
                            $regex: new RegExp(searchCoinditions.codeValue, 'i')
                        }
                    }
                });
            }
            if (searchCoinditions.inCodeSet !== undefined) {
                if (searchCoinditions.inCodeSet.codeValue !== undefined) {
                    matchStages.push({
                        $match: {
                            'hasCategoryCode.codeValue': {
                                $exists: true,
                                $regex: new RegExp(searchCoinditions.inCodeSet.codeValue, 'i')
                            }
                        }
                    });
                }

                if (searchCoinditions.inCodeSet.inCodeSet !== undefined) {
                    if (searchCoinditions.inCodeSet.inCodeSet.codeValue !== undefined) {
                        matchStages.push({
                            $match: {
                                codeValue: {
                                    $exists: true,
                                    $regex: new RegExp(searchCoinditions.inCodeSet.inCodeSet.codeValue, 'i')
                                }
                            }
                        });
                    }
                }
            }

            const totalCountResult = await accountTitleRepo.accountTitleModel.aggregate([
                { $unwind: '$hasCategoryCode' },
                { $unwind: '$hasCategoryCode.hasCategoryCode' },
                ...matchStages,
                { $count: 'totalCount' }
            ])
                .exec();
            const totalCount = (Array.isArray(totalCountResult) && totalCountResult.length > 0) ? totalCountResult[0].totalCount : 0;

            const aggregate = accountTitleRepo.accountTitleModel.aggregate([
                { $unwind: '$hasCategoryCode' },
                { $unwind: '$hasCategoryCode.hasCategoryCode' },
                ...matchStages,
                {
                    $project: {
                        _id: 0,
                        codeValue: '$hasCategoryCode.hasCategoryCode.codeValue',
                        name: '$hasCategoryCode.hasCategoryCode.name',
                        inCodeSet: {
                            codeValue: '$hasCategoryCode.codeValue',
                            name: '$hasCategoryCode.name',
                            inCodeSet: {
                                codeValue: '$codeValue',
                                name: '$name'
                            },
                            inDefinedTermSet: '$hasCategoryCode.inDefinedTermSet'
                        },
                        additionalProperty: '$hasCategoryCode.hasCategoryCode.additionalProperty'
                    }
                }
            ]);

            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore else */
            if (searchCoinditions.limit !== undefined && searchCoinditions.page !== undefined) {
                aggregate.limit(searchCoinditions.limit * searchCoinditions.page)
                    .skip(searchCoinditions.limit * (searchCoinditions.page - 1));
            }

            const accountTitles = await aggregate.exec();

            res.set('X-Total-Count', totalCount.toString());
            res.json(accountTitles);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 細目更新
 */
accountTitlesRouter.put(
    '/:codeValue',
    permitScopes(['admin']),
    ...[
        body('codeValue')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('name')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('inCodeSet')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required'),
        body('inCodeSet.codeValue')
            .not()
            .isEmpty()
            .withMessage((_, __) => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const accountTitleSet: chevre.factory.accountTitle.IAccountTitle = req.body.inCodeSet;
            const accountTitle: chevre.factory.accountTitle.IAccountTitle = { ...req.body, codeValue: req.params.codeValue };
            delete accountTitle.inCodeSet;

            const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);

            const doc = await accountTitleRepo.accountTitleModel.findOneAndUpdate(
                {
                    'hasCategoryCode.hasCategoryCode.codeValue': accountTitle.codeValue
                },
                { 'hasCategoryCode.$[element].hasCategoryCode.$': accountTitle },
                <any>{
                    new: true,
                    arrayFilters: [{ 'element.codeValue': accountTitleSet.codeValue }]
                }
            )
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound('AccountTitle');
            }

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default accountTitlesRouter;
