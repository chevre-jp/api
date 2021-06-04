/**
 * ルーター
 */
import * as express from 'express';

import cronRouter from './cron';
import ahRouter from './_ah';

import healthRouter from './health';
import membersRouter from './members';
import projectsRouter from './projects';
import projectDetailRouter from './projects/detail';
import webhooksRouter from './webhooks';

import authentication from '../middlewares/authentication';
import setPermissions from '../middlewares/setPermissions';
import setProject from '../middlewares/setProject';

const router = express.Router();

// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })

router.use('/_ah', ahRouter);
router.use('/cron', cronRouter);
router.use('/health', healthRouter);
router.use('/webhooks', webhooksRouter);

// 認証
router.use(authentication);

// リクエストプロジェクト設定
router.use(setProject);

// プロジェクトメンバー権限を確認
router.use(setPermissions);

// メンバールーター
router.use('/members', membersRouter);

// プロジェクトルーター
router.use('/projects', projectsRouter);

// 以下、プロジェクト指定済の状態でルーティング
router.use('/projects/:id', projectDetailRouter);

export default router;
