"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * IAMルーター
 */
// import * as chevre from '@chevre/domain';
const express = require("express");
// import { NO_CONTENT } from 'http-status';
// import permitScopes from '../middlewares/permitScopes';
// import validator from '../middlewares/validator';
const members_1 = require("./iam/members");
const roles_1 = require("./iam/roles");
// const ADMIN_USER_POOL_ID = <string>process.env.ADMIN_USER_POOL_ID;
const iamRouter = express.Router();
iamRouter.use('/members', members_1.default);
iamRouter.use('/roles', roles_1.default);
exports.default = iamRouter;
