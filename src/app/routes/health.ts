/**
 * ヘルスチェックルーター
 */
import * as express from 'express';
import * as mongoose from 'mongoose';

const healthRouter = express.Router();

import * as createDebug from 'debug';
import { OK } from 'http-status';

import * as redis from '../../redis';

const debug = createDebug('chevre-api:router');
// 接続確認をあきらめる時間(ミリ秒)
const TIMEOUT_GIVE_UP_CHECKING_IN_MILLISECONDS = 3000;

healthRouter.get(
    '',
    async (_, res, next) => {
        let timer: NodeJS.Timer | undefined;

        try {
            await new Promise<void>(async (resolve, reject) => {
                let givenUpChecking = false;

                timer = setInterval(
                    async () => {
                        // すでにあきらめていたら何もしない
                        if (givenUpChecking) {
                            return;
                        }

                        if (typeof mongoose.connection?.db?.admin !== 'function') {
                            return;
                        }

                        try {
                            await mongoose.connection.db.admin()
                                .ping();

                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    },
                    // tslint:disable-next-line:no-magic-numbers
                    500
                );

                setTimeout(
                    () => {
                        givenUpChecking = true;
                        reject(new Error('unable to check MongoDB connection'));
                    },
                    TIMEOUT_GIVE_UP_CHECKING_IN_MILLISECONDS
                );
            });

            if (timer !== undefined) {
                clearInterval(timer);
            }

            await new Promise<void>(async (resolve, reject) => {
                let givenUpChecking = false;

                // redisサーバー接続が生きているかどうか確認
                redis.getClient()
                    .ping('wake up!', (err, reply) => {
                        debug('redis ping:', err, reply);
                        // すでにあきらめていたら何もしない
                        if (givenUpChecking) {
                            return;
                        }

                        if (err instanceof Error) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });

                setTimeout(
                    () => {
                        givenUpChecking = true;
                        reject(new Error('unable to check db connection'));
                    },
                    TIMEOUT_GIVE_UP_CHECKING_IN_MILLISECONDS
                );
            });

            res.status(OK)
                .send('healthy!');
        } catch (error) {
            if (timer !== undefined) {
                clearInterval(timer);
            }

            next(error);
        }
    });

export default healthRouter;
