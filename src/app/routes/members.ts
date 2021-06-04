/**
 * メンバールーター
 */
import * as express from 'express';
// tslint:disable-next-line:no-implicit-dependencies

import meRouter from './members/me';

const membersRouter = express.Router();

membersRouter.use('/me', meRouter);

export default membersRouter;
