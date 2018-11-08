/**
 * 予約タスク実行
 */
import * as chevre from '@chevre/domain';
import * as createDebug from 'debug';

import { connectMongo } from '../../../connectMongo';

const debug = createDebug('chevre-api:jobs');

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
                    chevre.factory.taskName.Reserve
                )({ taskRepo: taskRepo, connection: connection });
            } catch (error) {
                console.error(error);
            }

            count -= 1;
        },
        INTERVAL_MILLISECONDS
    );
};
