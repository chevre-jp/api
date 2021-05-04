"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ルーター
 */
const express = require("express");
const cron_1 = require("./cron");
const _ah_1 = require("./_ah");
const health_1 = require("./health");
const projects_1 = require("./projects");
const detail_1 = require("./projects/detail");
const webhooks_1 = require("./webhooks");
const authentication_1 = require("../middlewares/authentication");
// import setPermissions from '../middlewares/setPermissions';
const setProject_1 = require("../middlewares/setProject");
const USE_PROJECTLESS_ROUTER = process.env.USE_PROJECTLESS_ROUTER === '1';
const router = express.Router();
// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })
router.use('/_ah', _ah_1.default);
router.use('/cron', cron_1.default);
router.use('/health', health_1.default);
router.use('/webhooks', webhooks_1.default);
// 認証
router.use(authentication_1.default);
// リクエストプロジェクト設定
router.use(setProject_1.default);
// プロジェクトメンバー権限を確認
// router.use(setPermissions);
// プロジェクトルーター
router.use('/projects', projects_1.default);
// 以下、プロジェクト指定済の状態でルーティング
if (USE_PROJECTLESS_ROUTER) {
    router.use('', detail_1.default);
}
router.use('/projects/:id', detail_1.default);
exports.default = router;
