/**
 * IAMロールルーター
 */
import * as chevre from '@chevre/domain';
import * as express from 'express';
import * as mongoose from 'mongoose';

import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const iamRolesRouter = express.Router();

/**
 * IAMロール検索
 */
iamRolesRouter.get(
    '',
    permitScopes(['iam.roles.read']),
    validator,
    async (req, res, next) => {
        try {
            const searchCoinditions: any = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
                sort: { roleName: chevre.factory.sortType.Ascending }
            };

            const roleRepo = new chevre.repository.Role(mongoose.connection);
            const roles = await roleRepo.search(searchCoinditions);

            res.json(roles);
        } catch (error) {
            next(error);
        }
    }
);

export default iamRolesRouter;
