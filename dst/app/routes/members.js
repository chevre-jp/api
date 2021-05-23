"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * メンバールーター
 */
const express = require("express");
// tslint:disable-next-line:no-implicit-dependencies
const me_1 = require("./members/me");
const membersRouter = express.Router();
membersRouter.use('/me', me_1.default);
exports.default = membersRouter;
