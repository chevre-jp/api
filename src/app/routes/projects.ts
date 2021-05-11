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

import { RoleName } from '../iam';

const ADMIN_USER_POOL_ID = <string>process.env.ADMIN_USER_POOL_ID;

const projectsRouter = Router();

/**
 * プロジェクト作成
 * 同時に作成者はプロジェクトオーナーになります
 */
projectsRouter.post(
    '',
    // permitScopes([]),
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
            .isURL(),
        body('settings.cognito.customerUserPool.id')
            .not()
            .isEmpty()
            .withMessage(() => 'required')
            .isString()
    ],
    validator,
    async (req, res, next) => {
        try {
            const memberRepo = new chevre.repository.Member(mongoose.connection);
            const projectRepo = new chevre.repository.Project(mongoose.connection);

            let project = createFromBody(req.body);

            let member;

            const personRepo = new chevre.repository.Person({
                userPoolId: ADMIN_USER_POOL_ID
            });
            const profile = await personRepo.getUserAttributesByAccessToken(req.accessToken);
            // const people = await personRepo.search({ id: req.user.sub });
            // if (people[0].memberOf === undefined) {
            //     throw new chevre.factory.errors.NotFound('Administrator.memberOf');
            // }
            const memberName = (typeof profile.givenName === 'string' && typeof profile.familyName === 'string')
                ? `${profile.givenName} ${profile.familyName}`
                : req.user.username;

            member = {
                typeOf: chevre.factory.personType.Person,
                id: req.user.sub,
                name: memberName,
                username: req.user.username,
                hasRole: [{
                    typeOf: 'OrganizationRole',
                    roleName: RoleName.Owner,
                    memberOf: { typeOf: project.typeOf, id: project.id }
                }]
            };

            // 権限作成
            await memberRepo.memberModel.create({
                project: { typeOf: project.typeOf, id: project.id },
                typeOf: 'OrganizationRole',
                member: member
            });

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
            },
            ...(typeof params.settings?.cognito?.customerUserPool?.id === 'string')
                ? {
                    cognito: { customerUserPool: { id: params.settings.cognito.customerUserPool.id } }
                }
                : undefined
            ,
            onOrderStatusChanged: {
                informOrder: (Array.isArray(params.settings?.onOrderStatusChanged?.informOrder))
                    ? params.settings.onOrderStatusChanged.informOrder
                    : []
            },
            sendgridApiKey: (typeof params.settings?.sendgridApiKey === 'string')
                ? params.settings?.sendgridApiKey
                : ''
        }
    };
}

/**
 * プロジェクト検索
 * 閲覧権限を持つプロジェクトを検索
 */
projectsRouter.get(
    '',
    permitScopes([]),
    ...[
        query('$projection.*')
            .toInt()
    ],
    validator,
    async (req, res, next) => {
        try {
            const projectRepo = new chevre.repository.Project(mongoose.connection);

            const searchConditions: chevre.factory.project.ISearchConditions = {
                ...req.query,
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const projects = await projectRepo.search(
                searchConditions,
                (req.query.$projection !== undefined && req.query.$projection !== null) ? { ...req.query.$projection } : undefined
            );

            res.json(projects);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * プロジェクト取得
 */
// tslint:disable-next-line:use-default-type-parameter
projectsRouter.get<ParamsDictionary>(
    '/:id',
    permitScopes(['projects.settings.read']),
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
    permitScopes([]),
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
//     permitScopes([]),
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
