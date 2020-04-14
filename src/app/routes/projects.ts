/**
 * プロジェクトルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const projectsRouter = Router();
projectsRouter.use(authentication);

/**
 * プロジェクト取得
 */
projectsRouter.get(
    '/:id',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const projectRepo = new chevre.repository.Project(mongoose.connection);

            // const projection: any = (req.memberPermissions.indexOf(`${RESOURCE_SERVER_IDENTIFIER}/projects.settings.read`) >= 0)
            //     ? undefined
            //     : { settings: 0 };
            const project = await projectRepo.findById({ id: req.params.id }, undefined);

            res.json(project);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * プロジェクト設定取得
 */
// projectsRouter.get(
//     '/:id/settings',
//     permitScopes(['admin']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const projectRepo = new chevre.repository.Project(mongoose.connection);
//             const project = await projectRepo.findById({ id: req.params.id });

//             res.json(project.settings);
//         } catch (error) {
//             next(error);
//         }
//     }
// );

export default projectsRouter;
