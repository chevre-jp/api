"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * プロジェクトルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const iam_1 = require("../iam");
const ADMIN_USER_POOL_ID = process.env.ADMIN_USER_POOL_ID;
const projectsRouter = express_1.Router();
/**
 * プロジェクト作成
 * 同時に作成者はプロジェクトオーナーになります
 */
projectsRouter.post('', 
// permitScopes([]),
...[
    express_validator_1.body('typeOf')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isString(),
    express_validator_1.body('name')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isString(),
    express_validator_1.body('id')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isString(),
    express_validator_1.body('logo')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isURL(),
    express_validator_1.body('settings.cognito.customerUserPool.id')
        .not()
        .isEmpty()
        .withMessage(() => 'required')
        .isString()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const memberRepo = new chevre.repository.Member(mongoose.connection);
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        let project = createFromBody(req.body);
        let member;
        const personRepo = new chevre.repository.Person({
            userPoolId: ADMIN_USER_POOL_ID
        });
        const profile = yield personRepo.getUserAttributesByAccessToken(req.accessToken);
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
                    roleName: iam_1.RoleName.Owner,
                    memberOf: { typeOf: project.typeOf, id: project.id }
                }]
        };
        // 権限作成
        yield memberRepo.memberModel.create({
            project: { typeOf: project.typeOf, id: project.id },
            typeOf: 'OrganizationRole',
            member: member
        });
        // プロジェクト作成
        project = yield projectRepo.projectModel.create(Object.assign(Object.assign({}, project), { _id: project.id }))
            .then((doc) => doc.toObject());
        res.status(http_status_1.CREATED)
            .json(project);
    }
    catch (error) {
        next(error);
    }
}));
function createFromBody(params) {
    var _a, _b, _c, _d, _e, _f, _g;
    return {
        id: params.id,
        typeOf: params.typeOf,
        logo: params.logo,
        name: params.name,
        settings: Object.assign(Object.assign({ onReservationStatusChanged: {
                informReservation: []
            } }, (typeof ((_c = (_b = (_a = params.settings) === null || _a === void 0 ? void 0 : _a.cognito) === null || _b === void 0 ? void 0 : _b.customerUserPool) === null || _c === void 0 ? void 0 : _c.id) === 'string')
            ? {
                cognito: { customerUserPool: { id: params.settings.cognito.customerUserPool.id } }
            }
            : undefined), { onOrderStatusChanged: {
                informOrder: (Array.isArray((_e = (_d = params.settings) === null || _d === void 0 ? void 0 : _d.onOrderStatusChanged) === null || _e === void 0 ? void 0 : _e.informOrder))
                    ? params.settings.onOrderStatusChanged.informOrder
                    : []
            }, sendgridApiKey: (typeof ((_f = params.settings) === null || _f === void 0 ? void 0 : _f.sendgridApiKey) === 'string')
                ? (_g = params.settings) === null || _g === void 0 ? void 0 : _g.sendgridApiKey : '' })
    };
}
/**
 * プロジェクト検索
 * 閲覧権限を持つプロジェクトを検索
 */
projectsRouter.get('', permitScopes_1.default([]), ...[
    express_validator_1.query('$projection.*')
        .toInt()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const projects = yield projectRepo.search(searchConditions, (req.query.$projection !== undefined && req.query.$projection !== null) ? Object.assign({}, req.query.$projection) : undefined);
        res.json(projects);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * プロジェクト取得
 */
// tslint:disable-next-line:use-default-type-parameter
projectsRouter.get('/:id', permitScopes_1.default(['projects.settings.read']), ...[
    express_validator_1.query('$projection.*')
        .toInt()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        // const projection: any = (req.memberPermissions.indexOf(`${RESOURCE_SERVER_IDENTIFIER}/projects.settings.read`) >= 0)
        //     ? undefined
        //     : { settings: 0 };
        // $projectionを適用
        const projection = (req.query.$projection !== undefined && req.query.$projection !== null)
            ? Object.assign({}, req.query.$projection) : undefined;
        const project = yield projectRepo.findById({ id: req.params.id }, projection);
        res.json(project);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * プロジェクト更新
 */
projectsRouter.patch('/:id', permitScopes_1.default([]), ...[], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        yield projectRepo.projectModel.findOneAndUpdate({ _id: req.params.id }, Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ updatedAt: new Date() }, (typeof req.body.name === 'string' && req.body.name.length > 0) ? { name: req.body.name } : undefined), (typeof req.body.logo === 'string' && req.body.logo.length > 0) ? { logo: req.body.logo } : undefined), (typeof ((_a = req.body.settings) === null || _a === void 0 ? void 0 : _a.sendgridApiKey) === 'string')
            ? { 'settings.sendgridApiKey': req.body.settings.sendgridApiKey }
            : undefined), (Array.isArray((_c = (_b = req.body.settings) === null || _b === void 0 ? void 0 : _b.onOrderStatusChanged) === null || _c === void 0 ? void 0 : _c.informOrder))
            ? { 'settings.onOrderStatusChanged.informOrder': req.body.settings.onOrderStatusChanged.informOrder }
            : undefined), (((_d = req.body.settings) === null || _d === void 0 ? void 0 : _d.cognito) !== undefined && ((_e = req.body.settings) === null || _e === void 0 ? void 0 : _e.cognito) !== null)
            ? { 'settings.cognito': req.body.settings.cognito }
            : undefined
        // "useMyCreditCards": true,
        // "useUsernameAsGMOMemberId": true,
        ))
            .exec();
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
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
exports.default = projectsRouter;
