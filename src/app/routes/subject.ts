/**
 * 勘定科目ルーター
 * @deprecated Use /accountTitles
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const subjectRouter = Router();

subjectRouter.use(authentication);

subjectRouter.get(
    '/getSubjectList',
    permitScopes(['admin', 'subjects', 'subjects.read-only']),
    validator,
    async (req, res, next) => {
        try {
            let subjects: chevre.factory.subject.ISubject[];

            const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
            const searchConditions: chevre.factory.subject.ISubjectSearchConditions = {
                ...req.query
            };

            const matchStages: any[] = [];
            matchStages.push({
                $match: {
                    'project.id': {
                        $exists: true,
                        $eq: (<any>searchConditions).project?.id?.$eq
                    }
                }
            });

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

            const accountTitles = <chevre.factory.accountTitle.IAccountTitle[]>await aggregate.exec();

            subjects = accountTitles.map((accountTitle) => {
                return {
                    id: accountTitle.codeValue,
                    subjectClassificationCd: <string>accountTitle.inCodeSet?.inCodeSet?.codeValue,
                    subjectClassificationName: <string>accountTitle.inCodeSet?.inCodeSet?.name,
                    subjectCd: <string>accountTitle.inCodeSet?.codeValue,
                    subjectName: <string>accountTitle.inCodeSet?.name,
                    detailCd: accountTitle.codeValue,
                    detailName: <string>accountTitle.name
                };
            });

            res.json(subjects);
        } catch (error) {
            next(error);
        }
    }
);

subjectRouter.post(
    '',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const accountTitle: chevre.factory.accountTitle.IAccountTitle = {
                project: req.body.attributes.project,
                typeOf: 'AccountTitle',
                codeValue: req.body.attributes.detailCd,
                name: req.body.attributes.detailName,
                inCodeSet: {
                    project: req.body.attributes.project,
                    typeOf: 'AccountTitle',
                    codeValue: req.body.attributes.subjectCd,
                    name: req.body.attributes.subjectName,
                    inCodeSet: {
                        project: req.body.attributes.project,
                        typeOf: 'AccountTitle',
                        codeValue: req.body.attributes.subjectClassificationCd,
                        name: req.body.attributes.subjectClassificationName
                    }
                }
            };
            const accountTitleSet = <chevre.factory.accountTitle.IAccountTitle>accountTitle.inCodeSet;
            const accountTitleCategory = <chevre.factory.accountTitle.IAccountTitle>accountTitle.inCodeSet?.inCodeSet;

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
                {
                    $push: {
                        'hasCategoryCode.$[accountTitleSet].hasCategoryCode': {
                            typeOf: accountTitle.typeOf,
                            codeValue: accountTitle.codeValue,
                            name: accountTitle.name,
                            additionalProperty: []
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
                .json('ok');
        } catch (error) {
            next(error);
        }
    }
);

subjectRouter.get(
    '',
    permitScopes(['admin', 'subjects', 'subjects.read-only']),
    validator,
    async (req, res, next) => {
        try {
            let subjects: chevre.factory.subject.ISubject[];

            const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
            const searchConditions: chevre.factory.subject.ISubjectSearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const matchStages: any[] = [];
            matchStages.push({
                $match: {
                    'project.id': {
                        $exists: true,
                        $eq: (<any>searchConditions).project?.id?.$eq
                    }
                }
            });

            if (typeof searchConditions.detailCd === 'string') {
                matchStages.push({
                    $match: {
                        'hasCategoryCode.hasCategoryCode.codeValue': {
                            $exists: true,
                            $regex: new RegExp(searchConditions.detailCd)
                        }
                    }
                });
            }

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

            const accountTitles = <chevre.factory.accountTitle.IAccountTitle[]>await aggregate.exec();

            subjects = accountTitles.map((accountTitle) => {
                return {
                    id: accountTitle.codeValue,
                    subjectClassificationCd: <string>accountTitle.inCodeSet?.inCodeSet?.codeValue,
                    subjectClassificationName: <string>accountTitle.inCodeSet?.inCodeSet?.name,
                    subjectCd: <string>accountTitle.inCodeSet?.codeValue,
                    subjectName: <string>accountTitle.inCodeSet?.name,
                    detailCd: accountTitle.codeValue,
                    detailName: <string>accountTitle.name
                };
            });

            res.json(subjects);
        } catch (error) {
            next(error);
        }
    }
);

subjectRouter.put(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const accountTitle: chevre.factory.accountTitle.IAccountTitle = {
                project: req.body.attributes.project,
                typeOf: 'AccountTitle',
                codeValue: req.body.attributes.detailCd,
                name: req.body.attributes.detailName,
                inCodeSet: {
                    project: req.body.attributes.project,
                    typeOf: 'AccountTitle',
                    codeValue: req.body.attributes.subjectCd,
                    name: req.body.attributes.subjectName,
                    inCodeSet: {
                        project: req.body.attributes.project,
                        typeOf: 'AccountTitle',
                        codeValue: req.body.attributes.subjectClassificationCd,
                        name: req.body.attributes.subjectClassificationName
                    }
                }
            };
            const accountTitleSet = <chevre.factory.accountTitle.IAccountTitle>accountTitle.inCodeSet;
            const accountTitleCategory = <chevre.factory.accountTitle.IAccountTitle>accountTitle.inCodeSet?.inCodeSet;

            const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);

            const doc = await accountTitleRepo.accountTitleModel.findOneAndUpdate(
                {
                    codeValue: accountTitleCategory.codeValue,
                    'hasCategoryCode.codeValue': accountTitleSet.codeValue,
                    'hasCategoryCode.hasCategoryCode.codeValue': accountTitle.codeValue
                },
                {
                    'hasCategoryCode.$[accountTitleSet].hasCategoryCode.$[accountTitle].codeValue': accountTitle.codeValue,
                    ...(typeof accountTitle.name === 'string')
                        ? { 'hasCategoryCode.$[accountTitleSet].hasCategoryCode.$[accountTitle].name': accountTitle.name }
                        : undefined,
                    ...(typeof accountTitleSet.name === 'string')
                        ? { 'hasCategoryCode.$[accountTitleSet].name': accountTitleSet.name }
                        : undefined,
                    ...(typeof accountTitleCategory.name === 'string')
                        ? { name: accountTitleCategory.name }
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

export default subjectRouter;
