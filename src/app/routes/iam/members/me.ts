/**
 * IAMメンバー(me)ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import * as mongoose from 'mongoose';

import permitScopes from '../../../middlewares/permitScopes';
import validator from '../../../middlewares/validator';

const iamMeRouter = Router();

iamMeRouter.get(
    '',
    permitScopes(['iam.members.me.read']),
    validator,
    async (req, res, next) => {
        try {
            const memberRepo = new chevre.repository.Member(mongoose.connection);
            const members = await memberRepo.search({
                member: { id: { $eq: req.user.sub } },
                project: { id: { $eq: req.project.id } },
                limit: 1
            });
            if (members.length === 0) {
                throw new chevre.factory.errors.NotFound('Member');
            }

            res.json(members[0]);
        } catch (error) {
            next(error);
        }
    }
);

export default iamMeRouter;
