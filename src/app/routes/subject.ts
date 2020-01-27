/**
 * 興行区分ルーター
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
    async (__, res, next) => {
        try {
            const subjectRepo = new chevre.repository.Subject(mongoose.connection);
            const subjects = await subjectRepo.getSubject();
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
                attributes: req.body.attributes
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
            const subjectRepo = new chevre.repository.Subject(mongoose.connection);
            const searchConditions: chevre.factory.subject.ISubjectSearchConditions = {
                // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
                sort: req.query.sort,
                detailCd: req.query.detailCd
            };

            const subject = await subjectRepo.searchSubject(searchConditions);

            res.json(subject);
        } catch (error) {
            next(error);
        }
    }
);
subjectRouter.get(
    '/:id',
    permitScopes(['admin', 'subjects', 'subjects.read-only']),
    validator,
    async (req, res, next) => {
        try {
            const subjectRepo = new chevre.repository.Subject(mongoose.connection);
            const subject = await subjectRepo.findSubjectById({
                id: req.params.id
            });
            res.json(subject);
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
