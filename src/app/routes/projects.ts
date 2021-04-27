/**
 * プロジェクトルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, query } from 'express-validator';
import { CREATED, NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const projectsRouter = Router();

/**
 * プロジェクト作成
 */
projectsRouter.post(
    '',
    permitScopes(['admin']),
    ...[
        body('typeOf')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isString(),
        body('name')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isString(),
        body('id')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isString(),
        body('logo')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isURL()
    ],
    validator,
    async (req, res, next) => {
        try {
            const projectRepo = new chevre.repository.Project(mongoose.connection);

            let project = createFromBody(req.body);

            // プロジェクト作成
            project = await projectRepo.projectModel.create({ ...project, _id: project.id })
                .then((doc) => doc.toObject());

            res.status(CREATED)
                .json(project);
        } catch (error) {
            next(error);
        }
    }
);

function createFromBody(params: any): chevre.factory.project.IProject {
    return {
        id: params.id,
        typeOf: params.typeOf,
        logo: params.logo,
        name: params.name,
        settings: {
            onReservationStatusChanged: {
                informReservation: []
            }
        }
    };
}

/**
 * プロジェクト取得
 */
// tslint:disable-next-line:use-default-type-parameter
projectsRouter.get<ParamsDictionary>(
    '/:id',
    permitScopes(['admin']),
    ...[
        query('$projection.*')
            .toInt()
    ],
    validator,
    async (req, res, next) => {
        try {
            const projectRepo = new chevre.repository.Project(mongoose.connection);

            // const projection: any = (req.memberPermissions.indexOf(`${RESOURCE_SERVER_IDENTIFIER}/projects.settings.read`) >= 0)
            //     ? undefined
            //     : { settings: 0 };
            // $projectionを適用
            const projection = (req.query.$projection !== undefined && req.query.$projection !== null)
                ? { ...req.query.$projection }
                : undefined;
            const project = await projectRepo.findById({ id: req.params.id }, projection);

            res.json(project);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * プロジェクト更新
 */
projectsRouter.patch(
    '/:id',
    permitScopes(['admin']),
    ...[],
    validator,
    async (req, res, next) => {
        try {
            const projectRepo = new chevre.repository.Project(mongoose.connection);

            await projectRepo.projectModel.findOneAndUpdate(
                { _id: req.params.id },
                {
                    updatedAt: new Date(),
                    ...(typeof req.body.name === 'string' && req.body.name.length > 0) ? { name: req.body.name } : undefined,
                    ...(typeof req.body.logo === 'string' && req.body.logo.length > 0) ? { logo: req.body.logo } : undefined,
                    ...(typeof req.body.settings?.sendgridApiKey === 'string')
                        ? { 'settings.sendgridApiKey': req.body.settings.sendgridApiKey }
                        : undefined,
                    ...(Array.isArray(req.body.settings?.onOrderStatusChanged?.informOrder))
                        ? { 'settings.onOrderStatusChanged.informOrder': req.body.settings.onOrderStatusChanged.informOrder }
                        : undefined,
                    ...(req.body.settings?.cognito !== undefined && req.body.settings?.cognito !== null)
                        ? { 'settings.cognito': req.body.settings.cognito }
                        : undefined
                    // "useMyCreditCards": true,
                    // "useUsernameAsGMOMemberId": true,
                }
            )
                .exec();

            res.status(NO_CONTENT)
                .end();
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
