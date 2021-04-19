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
const projectsRouter = express_1.Router();
/**
 * プロジェクト作成
 */
projectsRouter.post('', permitScopes_1.default(['admin']), ...[
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
        .isURL()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        let project = createFromBody(req.body);
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
projectsRouter.get('/:id', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        // const projection: any = (req.memberPermissions.indexOf(`${RESOURCE_SERVER_IDENTIFIER}/projects.settings.read`) >= 0)
        //     ? undefined
        //     : { settings: 0 };
        const project = yield projectRepo.findById({ id: req.params.id }, undefined);
        res.json(project);
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
exports.default = projectsRouter;
