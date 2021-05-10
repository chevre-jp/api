/**
 * プロジェクトメンバールーター
 */
import * as chevre from '@chevre/domain';
import * as express from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body } from 'express-validator';
import { NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

import iamMeRouter from './members/me';

const iamMembersRouter = express.Router();

iamMembersRouter.use('/me', iamMeRouter);

/**
 * プロジェクトメンバー検索
 */
iamMembersRouter.get(
    '',
    permitScopes(['iam.members.read']),
    validator,
    async (req, res, next) => {
        try {
            const searchCoinditions: any = {
                ...req.query,
                project: { id: { $eq: req.project.id } },
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const memberRepo = new chevre.repository.Member(mongoose.connection);
            const members = await memberRepo.search(searchCoinditions);

            res.json(members);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * プロジェクトメンバー取得
 */
iamMembersRouter.get(
    '/:id',
    permitScopes(['iam.members.read']),
    validator,
    async (req, res, next) => {
        try {
            const memberRepo = new chevre.repository.Member(mongoose.connection);
            const members = await memberRepo.search({
                member: { id: { $eq: req.params.id } },
                project: { id: { $eq: req.project.id } },
                limit: 1
            });
            if (members.length === 0) {
                throw new chevre.factory.errors.NotFound(memberRepo.memberModel.modelName);
            }

            res.json(members[0]);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * プロジェクトメンバー更新
 */
// tslint:disable-next-line:use-default-type-parameter
iamMembersRouter.put<ParamsDictionary>(
    '/:id',
    permitScopes(['iam.members.write']),
    ...[
        body('member')
            .not()
            .isEmpty()
            .withMessage(() => 'required'),
        body('member.name')
            .optional()
            .isString(),
        body('member.hasRole')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isArray(),
        body('member.hasRole.*.roleName')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isString()
    ],
    validator,
    async (req, res, next) => {
        try {
            const memberRepo = new chevre.repository.Member(mongoose.connection);

            // ロールを作成
            const roles = (<any[]>req.body.member.hasRole).map((r: any) => {
                return {
                    typeOf: 'OrganizationRole',
                    roleName: <string>r.roleName,
                    memberOf: { typeOf: req.project.typeOf, id: req.project.id }
                };
            });

            const name: string | undefined = req.body.member?.name;

            const doc = await memberRepo.memberModel.findOneAndUpdate(
                {
                    'member.id': {
                        $eq: req.params.id
                    },
                    'project.id': {
                        $eq: req.project.id
                    }
                },
                {
                    'member.hasRole': roles,
                    ...(typeof name === 'string') ? { 'member.name': name } : undefined
                }
            )
                .exec();

            if (doc === null) {
                throw new chevre.factory.errors.NotFound(memberRepo.memberModel.modelName);
            }

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

/**
 * プロジェクトメンバー削除
 */
iamMembersRouter.delete(
    '/:id',
    permitScopes(['iam.members.write']),
    validator,
    async (req, res, next) => {
        try {
            const memberRepo = new chevre.repository.Member(mongoose.connection);
            const doc = await memberRepo.memberModel.findOneAndDelete({
                'member.id': {
                    $eq: req.params.id
                },
                'project.id': {
                    $eq: req.project.id
                }
            })
                .exec();
            if (doc === null) {
                throw new chevre.factory.errors.NotFound(memberRepo.memberModel.modelName);
            }

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default iamMembersRouter;
