/**
 * IAMルーター
 */
// import * as chevre from '@chevre/domain';
import * as express from 'express';
// import { NO_CONTENT } from 'http-status';

// import permitScopes from '../middlewares/permitScopes';
// import validator from '../middlewares/validator';

import iamMembersRouter from './iam/members';
import iamRolesRouter from './iam/roles';

// const ADMIN_USER_POOL_ID = <string>process.env.ADMIN_USER_POOL_ID;

const iamRouter = express.Router();

iamRouter.use('/members', iamMembersRouter);
iamRouter.use('/roles', iamRolesRouter);

export default iamRouter;
