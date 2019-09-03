/**
 * 予約キャンセルタスク実行
 */
import * as chevre from '@chevre/domain';

import { connectMongo } from '../../../connectMongo';

const redisClient = chevre.redis.createClient({
    // tslint:disable-next-line:no-magic-numbers
    port: Number(<string>process.env.REDIS_PORT),
    host: <string>process.env.REDIS_HOST,
    password: <string>process.env.REDIS_KEY,
    tls: (process.env.REDIS_TLS_SERVERNAME !== undefined) ? { servername: process.env.REDIS_TLS_SERVERNAME } : undefined
});

export default async () => {
    const connection = await connectMongo({ defaultConnection: false });

    let count = 0;

    const MAX_NUBMER_OF_PARALLEL_TASKS = 10;
    const INTERVAL_MILLISECONDS = 500;

    setInterval(
        async () => {
            if (count > MAX_NUBMER_OF_PARALLEL_TASKS) {
                return;
            }

            count += 1;

            try {
                await chevre.service.task.executeByName({
                    name: chevre.factory.taskName.CancelReservation
                })({ connection: connection, redisClient: redisClient });
            } catch (error) {
                console.error(error);
            }

            count -= 1;
        },
        INTERVAL_MILLISECONDS
    );
};
