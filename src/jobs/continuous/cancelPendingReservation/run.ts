/**
 * 仮予約キャンセルタスク実行
 */
import * as chevre from '@chevre/domain';
import * as createDebug from 'debug';

import { connectMongo } from '../../../connectMongo';

const debug = createDebug('chevre-api:jobs');
const redisClient = chevre.redis.createClient({
    // tslint:disable-next-line:no-magic-numbers
    port: Number(<string>process.env.REDIS_PORT),
    host: <string>process.env.REDIS_HOST,
    password: <string>process.env.REDIS_KEY,
    tls: { servername: <string>process.env.REDIS_HOST }
});

export default async () => {
    const connection = await connectMongo({ defaultConnection: false });

    let count = 0;

    const MAX_NUBMER_OF_PARALLEL_TASKS = 10;
    const INTERVAL_MILLISECONDS = 500;
    const taskRepo = new chevre.repository.Task(connection);

    setInterval(
        async () => {
            if (count > MAX_NUBMER_OF_PARALLEL_TASKS) {
                return;
            }

            count += 1;

            try {
                debug('count:', count);
                await chevre.service.task.executeByName(
                    chevre.factory.taskName.CancelPendingReservation
                )({
                    taskRepo: taskRepo,
                    connection: connection,
                    redisClient: redisClient
                });
            } catch (error) {
                console.error(error);
            }

            count -= 1;
        },
        INTERVAL_MILLISECONDS
    );
};
