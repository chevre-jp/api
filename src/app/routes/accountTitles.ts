/**
 * 勘定科目ルーター
 */
import * as chevre from '@chevre/domain';
import * as createDebug from 'debug';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body } from 'express-validator';
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
        body('project')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('codeValue')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('name')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: 'Project' };

            const accountTitle: chevre.factory.accountTitle.IAccountTitle = {
                ...req.body,
                project: project
            };

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
            const searchConditions: chevre.factory.accountTitle.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            // const accountTitles = await accountTitleRepo.search(searchConditions);
            // res.json(accountTitles);

            const conditions: any[] = [
                { typeOf: 'AccountTitle' }
            ];
            if (searchConditions.project !== undefined) {
                if (Array.isArray(searchConditions.project.ids)) {
                    conditions.push({
                        'project.id': {
                            $exists: true,
                            $in: searchConditions.project.ids
                        }
                    });
                }
            }

            if (typeof searchConditions.codeValue === 'string') {
                conditions.push({
                    codeValue: {
                        $exists: true,
                        $regex: new RegExp(searchConditions.codeValue)
                    }
                });
            } else if (searchConditions.codeValue !== undefined && searchConditions.codeValue !== null) {
                if (typeof searchConditions.codeValue.$eq === 'string') {
                    conditions.push({
                        codeValue: {
                            $exists: true,
                            $eq: searchConditions.codeValue.$eq
                        }
                    });
                }
            }

            // const totalCount = await accountTitleRepo.accountTitleModel.countDocuments(
            //     { $and: conditions }
            // )
            //     .setOptions({ maxTimeMS: 10000 })
            //     .exec();

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
            if (searchConditions.limit !== undefined && searchConditions.page !== undefined) {
                query.limit(searchConditions.limit)
                    .skip(searchConditions.limit * (searchConditions.page - 1));
            }
            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore else */
            if (searchConditions.sort !== undefined) {
                query.sort(searchConditions.sort);
            }

            const accountTitles = await query.setOptions({ maxTimeMS: 10000 })
                .exec()
                .then((docs) => docs.map((doc) => doc.toObject()));

            res.json(accountTitles);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 科目分類更新
 */
// tslint:disable-next-line:use-default-type-parameter
accountTitlesRouter.put<ParamsDictionary>(
    '/accountTitleCategory/:codeValue',
    permitScopes(['admin']),
    ...[
        body('codeValue')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('name')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const accountTitleCategory: chevre.factory.accountTitle.IAccountTitle = { ...req.body, codeValue: req.params.codeValue };

            const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);

            const doc = await accountTitleRepo.accountTitleModel.findOneAndUpdate(
                {
                    'project.id': {
                        $exists: true,
                        $eq: accountTitleCategory.project.id
                    },
                    codeValue: accountTitleCategory.codeValue
                },
                accountTitleCategory,
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
            .withMessage(() => 'Required'),
        body('name')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('inCodeSet')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('inCodeSet.codeValue')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const accountTitleCategory: chevre.factory.accountTitle.IAccountTitle = req.body.inCodeSet;
            const accountTitleSet: chevre.factory.accountTitle.IAccountTitle = req.body;

            const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);

            // 科目分類の存在確認
            let doc = await accountTitleRepo.accountTitleModel.findOne(
                {
                    'project.id': {
                        $exists: true,
                        $eq: accountTitleSet.project.id
                    },
                    codeValue: accountTitleCategory.codeValue
                }
            )
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound('AccountTitleCategory');
            }

            debug('creating accountTitleSet', accountTitleSet);
            doc = await accountTitleRepo.accountTitleModel.findOneAndUpdate(
                {
                    'project.id': {
                        $exists: true,
                        $eq: accountTitleSet.project.id
                    },
                    codeValue: accountTitleCategory.codeValue,
                    'hasCategoryCode.codeValue': { $ne: accountTitleSet.codeValue }
                },
                {
                    $push: {
                        hasCategoryCode: {
                            typeOf: accountTitleSet.typeOf,
                            codeValue: accountTitleSet.codeValue,
                            name: accountTitleSet.name,
                            additionalProperty: accountTitleSet.additionalProperty
                        }
                    }
                },
                { new: true }
            )
                .exec();
            // 存在しなければ科目コード重複
            if (doc === null) {
                throw new chevre.factory.errors.AlreadyInUse('AccountTitle', ['hasCategoryCode.codeValue']);
            }

            res.status(CREATED)
                .json(accountTitleSet);
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
            const searchConditions: chevre.factory.accountTitle.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            // const accountTitles = await accountTitleRepo.search(searchConditions);
            // res.json(accountTitles);

            const matchStages: any[] = [];
            if (searchConditions.project !== undefined) {
                if (Array.isArray(searchConditions.project.ids)) {
                    matchStages.push({
                        $match: {
                            'project.id': {
                                $exists: true,
                                $in: searchConditions.project.ids
                            }
                        }
                    });
                }
            }

            if (typeof searchConditions.codeValue === 'string') {
                matchStages.push({
                    $match: {
                        'hasCategoryCode.codeValue': {
                            $exists: true,
                            $regex: new RegExp(searchConditions.codeValue)
                        }
                    }
                });
            } else if (searchConditions.codeValue !== undefined && searchConditions.codeValue !== null) {
                if (typeof searchConditions.codeValue.$eq === 'string') {
                    matchStages.push({
                        $match: {
                            'hasCategoryCode.codeValue': {
                                $exists: true,
                                $eq: searchConditions.codeValue.$eq
                            }
                        }
                    });
                }
            }

            if (searchConditions.inCodeSet !== undefined) {
                if (typeof searchConditions.inCodeSet.codeValue === 'string') {
                    matchStages.push({
                        $match: {
                            codeValue: {
                                $exists: true,
                                $regex: new RegExp(searchConditions.inCodeSet.codeValue)
                            }
                        }
                    });
                } else if (searchConditions.inCodeSet.codeValue !== undefined && searchConditions.inCodeSet.codeValue !== null) {
                    if (typeof searchConditions.inCodeSet.codeValue.$eq === 'string') {
                        matchStages.push({
                            $match: {
                                codeValue: {
                                    $exists: true,
                                    $eq: searchConditions.inCodeSet.codeValue.$eq
                                }
                            }
                        });
                    }
                }
            }

            // const totalCountResult = await accountTitleRepo.accountTitleModel.aggregate([
            //     { $unwind: '$hasCategoryCode' },
            //     ...matchStages,
            //     { $count: 'totalCount' }
            // ])
            //     .exec();
            // const totalCount = (Array.isArray(totalCountResult) && totalCountResult.length > 0) ? totalCountResult[0].totalCount : 0;

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
            if (searchConditions.limit !== undefined && searchConditions.page !== undefined) {
                aggregate.limit(searchConditions.limit * searchConditions.page)
                    .skip(searchConditions.limit * (searchConditions.page - 1));
            }

            const accountTitles = await aggregate.exec();

            res.json(accountTitles);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 科目更新
 */
// tslint:disable-next-line:use-default-type-parameter
accountTitlesRouter.put<ParamsDictionary>(
    '/accountTitleSet/:codeValue',
    permitScopes(['admin']),
    ...[
        body('codeValue')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('name')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const accountTitleSet: chevre.factory.accountTitle.IAccountTitle = { ...req.body, codeValue: req.params.codeValue };
            const accountTitleCategory = <chevre.factory.accountTitle.IAccountTitle>accountTitleSet.inCodeSet;

            const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);

            debug('updating accountTitleSet', accountTitleSet);
            const doc = await accountTitleRepo.accountTitleModel.findOneAndUpdate(
                {
                    'project.id': {
                        $exists: true,
                        $eq: accountTitleSet.project.id
                    },
                    codeValue: accountTitleCategory.codeValue,
                    'hasCategoryCode.codeValue': accountTitleSet.codeValue
                },
                {
                    'hasCategoryCode.$[accountTitleSet].name': accountTitleSet.name,
                    ...(Array.isArray(accountTitleSet.additionalProperty))
                        ? {
                            'hasCategoryCode.$[accountTitleSet].additionalProperty'
                                : accountTitleSet.additionalProperty
                        }
                        : undefined
                },
                <any>{
                    new: true,
                    arrayFilters: [
                        { 'accountTitleSet.codeValue': accountTitleSet.codeValue }
                    ]
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
            .withMessage(() => 'Required'),
        body('name')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('inCodeSet')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('inCodeSet.codeValue')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('inCodeSet.inCodeSet')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('inCodeSet.inCodeSet.codeValue')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const accountTitleSet: chevre.factory.accountTitle.IAccountTitle = req.body.inCodeSet;
            const accountTitleCategory: chevre.factory.accountTitle.IAccountTitle = req.body.inCodeSet.inCodeSet;
            const accountTitle: chevre.factory.accountTitle.IAccountTitle = req.body;

            const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);

            // 科目の存在確認
            let doc = await accountTitleRepo.accountTitleModel.findOne({
                'project.id': {
                    $exists: true,
                    $eq: accountTitle.project.id
                },
                codeValue: accountTitleCategory.codeValue,
                'hasCategoryCode.codeValue': accountTitleSet.codeValue
            })
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound('AccountTitleSet');
            }

            doc = await accountTitleRepo.accountTitleModel.findOneAndUpdate(
                {
                    'project.id': {
                        $exists: true,
                        $eq: accountTitle.project.id
                    },
                    codeValue: accountTitleCategory.codeValue,
                    'hasCategoryCode.codeValue': accountTitleSet.codeValue,
                    'hasCategoryCode.hasCategoryCode.codeValue': { $ne: accountTitle.codeValue }
                },
                {
                    $push: {
                        'hasCategoryCode.$[accountTitleSet].hasCategoryCode': {
                            typeOf: accountTitle.typeOf,
                            codeValue: accountTitle.codeValue,
                            name: accountTitle.name,
                            additionalProperty: accountTitle.additionalProperty
                        }
                    }
                },
                <any>{
                    new: true,
                    arrayFilters: [
                        { 'accountTitleSet.codeValue': accountTitleSet.codeValue }
                    ]
                }
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
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    async (req, res, next) => {
        try {
            const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
            const searchConditions: chevre.factory.accountTitle.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            // const accountTitles = await accountTitleRepo.search(searchConditions);
            // res.json(accountTitles);

            const matchStages: any[] = [];
            if (searchConditions.project !== undefined) {
                if (Array.isArray(searchConditions.project.ids)) {
                    matchStages.push({
                        $match: {
                            'project.id': {
                                $exists: true,
                                $in: searchConditions.project.ids
                            }
                        }
                    });
                }
            }

            if (typeof searchConditions.codeValue === 'string') {
                matchStages.push({
                    $match: {
                        'hasCategoryCode.hasCategoryCode.codeValue': {
                            $exists: true,
                            $regex: new RegExp(searchConditions.codeValue)
                        }
                    }
                });
            } else if (searchConditions.codeValue !== undefined && searchConditions.codeValue !== null) {
                if (typeof searchConditions.codeValue.$eq === 'string') {
                    matchStages.push({
                        $match: {
                            'hasCategoryCode.hasCategoryCode.codeValue': {
                                $exists: true,
                                $eq: searchConditions.codeValue.$eq
                            }
                        }
                    });
                }
            }

            if (searchConditions.inCodeSet !== undefined) {
                if (typeof searchConditions.inCodeSet.codeValue === 'string') {
                    matchStages.push({
                        $match: {
                            'hasCategoryCode.codeValue': {
                                $exists: true,
                                $regex: new RegExp(searchConditions.inCodeSet.codeValue)
                            }
                        }
                    });
                } else if (searchConditions.inCodeSet.codeValue !== undefined && searchConditions.inCodeSet.codeValue !== null) {
                    if (typeof searchConditions.inCodeSet.codeValue.$eq === 'string') {
                        matchStages.push({
                            $match: {
                                'hasCategoryCode.codeValue': {
                                    $exists: true,
                                    $eq: searchConditions.inCodeSet.codeValue.$eq
                                }
                            }
                        });
                    }
                }

                if (searchConditions.inCodeSet.inCodeSet !== undefined) {
                    if (typeof searchConditions.inCodeSet.inCodeSet.codeValue === 'string') {
                        matchStages.push({
                            $match: {
                                codeValue: {
                                    $exists: true,
                                    $regex: new RegExp(searchConditions.inCodeSet.inCodeSet.codeValue)
                                }
                            }
                        });
                    } else if (searchConditions.inCodeSet.inCodeSet.codeValue !== undefined
                        && searchConditions.inCodeSet.inCodeSet.codeValue !== null) {
                        if (typeof searchConditions.inCodeSet.inCodeSet.codeValue.$eq === 'string') {
                            matchStages.push({
                                $match: {
                                    codeValue: {
                                        $exists: true,
                                        $eq: searchConditions.inCodeSet.inCodeSet.codeValue.$eq
                                    }
                                }
                            });
                        }
                    }
                }
            }

            // const totalCountResult = await accountTitleRepo.accountTitleModel.aggregate([
            //     { $unwind: '$hasCategoryCode' },
            //     { $unwind: '$hasCategoryCode.hasCategoryCode' },
            //     ...matchStages,
            //     { $count: 'totalCount' }
            // ])
            //     .exec();
            // const totalCount = (Array.isArray(totalCountResult) && totalCountResult.length > 0) ? totalCountResult[0].totalCount : 0;

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
            if (searchConditions.limit !== undefined && searchConditions.page !== undefined) {
                aggregate.limit(searchConditions.limit * searchConditions.page)
                    .skip(searchConditions.limit * (searchConditions.page - 1));
            }

            const accountTitles = await aggregate.exec();

            res.json(accountTitles);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 細目更新
 */

// tslint:disable-next-line:use-default-type-parameter
accountTitlesRouter.put<ParamsDictionary>(
    '/:codeValue',
    permitScopes(['admin']),
    ...[
        body('codeValue')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('name')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('inCodeSet')
            .not()
            .isEmpty()
            .withMessage(() => 'Required'),
        body('inCodeSet.codeValue')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const accountTitle: chevre.factory.accountTitle.IAccountTitle = { ...req.body, codeValue: req.params.codeValue };
            const accountTitleSet = <chevre.factory.accountTitle.IAccountTitle>accountTitle.inCodeSet;
            const accountTitleCategory = <chevre.factory.accountTitle.IAccountTitle>accountTitle.inCodeSet?.inCodeSet;

            const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);

            const doc = await accountTitleRepo.accountTitleModel.findOneAndUpdate(
                {
                    'project.id': {
                        $exists: true,
                        $eq: accountTitle.project.id
                    },
                    codeValue: accountTitleCategory.codeValue,
                    'hasCategoryCode.codeValue': accountTitleSet.codeValue,
                    'hasCategoryCode.hasCategoryCode.codeValue': accountTitle.codeValue
                },
                {
                    'hasCategoryCode.$[accountTitleSet].hasCategoryCode.$[accountTitle].codeValue': accountTitle.codeValue,
                    ...(typeof accountTitle.name === 'string')
                        ? { 'hasCategoryCode.$[accountTitleSet].hasCategoryCode.$[accountTitle].name': accountTitle.name }
                        : undefined,
                    ...(Array.isArray(accountTitle.additionalProperty))
                        ? {
                            'hasCategoryCode.$[accountTitleSet].hasCategoryCode.$[accountTitle].additionalProperty'
                                : accountTitle.additionalProperty
                        }
                        : undefined
                },
                <any>{
                    new: true,
                    arrayFilters: [
                        { 'accountTitleSet.codeValue': accountTitleSet.codeValue },
                        { 'accountTitle.codeValue': accountTitle.codeValue }
                    ]
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
