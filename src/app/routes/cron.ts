/**
 * cronルーター
 */
import * as chevre from '@chevre/domain';
import * as express from 'express';
import { NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import { main } from '../../jobs/triggered/createTopDeckEvents/run';

const TOPDECK_PROJECT = process.env.TOPDECK_PROJECT;

const cronRouter = express.Router();

cronRouter.get(
    '/createTopDeckEvents',
    async (_, res, next) => {
        try {
            if (typeof TOPDECK_PROJECT === 'string') {
                await main(mongoose.connection, { typeOf: chevre.factory.organizationType.Project, id: TOPDECK_PROJECT });
            }

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default cronRouter;
