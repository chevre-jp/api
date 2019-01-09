/**
 * 勘定科目ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { CREATED } from 'http-status';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const accountTitlesRouter = Router();
accountTitlesRouter.use(authentication);

/**
 * 科目分類追加
 */
accountTitlesRouter.post(
    '/accountTitleCategory',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const accountTitle: chevre.factory.accountTitle.IAccountTitle = req.body;
            const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
            await accountTitleRepo.save(accountTitle);
            res.status(CREATED).json(accountTitle);
        } catch (error) {
            next(error);
        }
    }
);

// accountTitlesRouter.get(
//     '/:codeValue',
//     permitScopes(['admin', 'accountTitles', 'accountTitles.read-only']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
//             const accountTitle = await accountTitleRepo.find({ codeValue: req.params.codeValue });
//             res.json(accountTitle);
//         } catch (error) {
//             next(error);
//         }
//     }
// );

// accountTitlesRouter.put(
//     '/:identifier',
//     permitScopes(['admin']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const accountTitle: chevre.factory.accountTitle.IAccountTitle = req.body;
//             const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
//             await accountTitleRepo.save(accountTitle);
//             res.status(NO_CONTENT).end();
//         } catch (error) {
//             next(error);
//         }
//     }
// );

// accountTitlesRouter.delete(
//     '/:identifier',
//     permitScopes(['admin']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
//             await accountTitleRepo.deleteByIdentifier({ identifier: req.params.identifier });
//             res.status(NO_CONTENT).end();
//         } catch (error) {
//             next(error);
//         }
//     }
// );

/**
 * 科目追加
 */
accountTitlesRouter.post(
    '/accountTitleSet',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const accountTitle: chevre.factory.accountTitle.IAccountTitle = {
                typeOf: req.body.typeOf,
                codeValue: req.body.codeValue,
                name: req.body.name,
                description: req.body.description
            };
            const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
            await accountTitleRepo.accountTitleModel.findOneAndUpdate(
                { codeValue: req.params.codeValue },
                {
                    $push: { hasCategoryCode: accountTitle }
                },
                { new: true }
            ).exec();

            res.status(CREATED).json(accountTitle);
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
    validator,
    async (req, res, next) => {
        try {
            const accountTitle: chevre.factory.accountTitle.IAccountTitle = req.body;
            const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
            await accountTitleRepo.accountTitleModel.findOneAndUpdate(
                {
                    codeValue: req.params.codeValue,
                    'hasCategoryCode.codeValue': req.params.accountTitleSetCodeValue
                },
                {
                    $push: { 'hasCategoryCode.$.hasCategoryCode': accountTitle }
                },
                { new: true }
            ).exec();

            res.status(CREATED).json(accountTitle);
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
            const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
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
            ]).exec();
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
                            }
                        }
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
 * 科目検索
 */
accountTitlesRouter.get(
    '/accountTitleSet',
    permitScopes(['admin', 'accountTitles', 'accountTitles.read-only']),
    validator,
    // tslint:disable-next-line:max-func-body-length
    async (req, res, next) => {
        try {
            const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
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
            ]).exec();
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
                        }
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
 * 科目分類検索
 */
accountTitlesRouter.get(
    '/accountTitleCategory',
    permitScopes(['admin', 'accountTitles', 'accountTitles.read-only']),
    validator,
    // tslint:disable-next-line:max-func-body-length
    async (req, res, next) => {
        try {
            const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
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
            ).setOptions({ maxTimeMS: 10000 })
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
                query.limit(searchCoinditions.limit).skip(searchCoinditions.limit * (searchCoinditions.page - 1));
            }
            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore else */
            if (searchCoinditions.sort !== undefined) {
                query.sort(searchCoinditions.sort);
            }

            const accountTitles = await query.setOptions({ maxTimeMS: 10000 }).exec().then((docs) => docs.map((doc) => doc.toObject()));

            res.set('X-Total-Count', totalCount.toString());
            res.json(accountTitles);
        } catch (error) {
            next(error);
        }
    }
);

export default accountTitlesRouter;
