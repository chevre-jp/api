/**
 * メンバー(me)ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import * as mongoose from 'mongoose';

import validator from '../../middlewares/validator';

const TOKEN_ISSUERS_AS_ADMIN: string[] = (typeof process.env.TOKEN_ISSUERS_AS_ADMIN === 'string')
    ? process.env.TOKEN_ISSUERS_AS_ADMIN.split(',')
    : [];

const meRouter = Router();

/**
 * プロジェクト検索
 * 閲覧権限を持つプロジェクトを検索
 */
meRouter.get(
    '/projects',
    // permitScopes([]),
    validator,
    async (req, res, next) => {
        try {
            const memberRepo = new chevre.repository.Member(mongoose.connection);
            const projectRepo = new chevre.repository.Project(mongoose.connection);

            // tslint:disable-next-line:no-magic-numbers
            const limit: number = (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100;
            const page: number = (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1;

            // 権限を持つプロジェクト検索
            let searchConditions: any;
            if (TOKEN_ISSUERS_AS_ADMIN.includes(req.user.iss)) {
                // 管理ユーザープールのクライアントであればreq.user.subとして検索
                searchConditions = {
                    'member.id': { $eq: req.user.sub }
                };
            } else {
                // それ以外であればreq.user.client_idとして検索
                searchConditions = {
                    'member.id': { $eq: req.user.client_id }
                };
            }

            const projectMembers = await memberRepo.memberModel.find(
                searchConditions,
                { project: 1 }
            )
                .limit(limit)
                .skip(limit * (page - 1))
                .setOptions({ maxTimeMS: 10000 })
                .exec()
                .then((docs) => docs.map((doc) => doc.toObject()));

            let projectIds = projectMembers.map((m) => m.project.id);
            // length=1だとidsの指定がない検索になってしまうので、ありえないプロジェクトIDで保管
            if (projectIds.length === 0) {
                projectIds = ['***NoProjects***'];
            }

            const projects = await projectRepo.search(
                {
                    ids: projectIds
                    // limit: limit
                },
                { settings: 0 }
            );

            res.json(projects);
        } catch (error) {
            next(error);
        }
    }
);

export default meRouter;
