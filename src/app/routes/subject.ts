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

            // const subjectRepo = new chevre.repository.Subject(mongoose.connection);
            // subjects = await subjectRepo.getSubject();

            const accountTitleRepo = new chevre.repository.AccountTitle(mongoose.connection);
            const searchConditions: chevre.factory.subject.ISubjectSearchConditions = {
                ...req.query
            };

            // const accountTitles = await accountTitleRepo.search(searchConditions);
            // res.json(accountTitles);

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
                    id: <string>accountTitle.codeValue,
                    subjectClassificationCd: <string>accountTitle.inCodeSet?.inCodeSet?.codeValue,
                    subjectClassificationName: <string>accountTitle.inCodeSet?.inCodeSet?.name,
                    subjectCd: <string>accountTitle.inCodeSet?.codeValue,
                    subjectName: <string>accountTitle.inCodeSet?.name,
                    detailCd: <string>accountTitle.codeValue,
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
            const subjectAttributes: chevre.factory.subject.ISubjectAttributes = req.body.attributes;
            // const subject: chevre.factory.subject.ISubjectAttributes = {
            //     subjectClassificationCd: req.body.subjectClassificationCd,
            //     subjectClassificationName: req.body.subjectClassificationName,
            //     subjectCd: req.body.subjectCd,
            //     subjectName: req.body.subjectName,
            //     detailCd: req.body.detailCd,
            //     detailName: req.body.detailName
            // };

            const subjectRepo = new chevre.repository.Subject(mongoose.connection);
            await subjectRepo.save({
                attributes: subjectAttributes
            });

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

            const subjectRepo = new chevre.repository.Subject(mongoose.connection);
            const searchConditions: chevre.factory.subject.ISubjectSearchConditions = {
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
                sort: req.query.sort,
                detailCd: req.query.detailCd
            };

            subjects = await subjectRepo.searchSubject(searchConditions);

            res.json(subjects);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 使用していないので不要
 */
// subjectRouter.get(
//     '/:id',
//     permitScopes(['admin', 'subjects', 'subjects.read-only']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const subjectRepo = new chevre.repository.Subject(mongoose.connection);
//             const subject = await subjectRepo.findSubjectById({
//                 id: req.params.id
//             });
//             res.json(subject);
//         } catch (error) {
//             next(error);
//         }
//     }
// );

subjectRouter.put(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const subjectRepo = new chevre.repository.Subject(mongoose.connection);
            await subjectRepo.save({
                id: req.params.id,
                attributes: req.body.attributes
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default subjectRouter;
