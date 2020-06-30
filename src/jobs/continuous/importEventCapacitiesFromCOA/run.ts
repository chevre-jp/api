/**
 * COAイベントキャパシティインポートタスク実行
 */
import * as chevre from '@chevre/domain';

import { connectMongo } from '../../../connectMongo';

const COA_MAXIMUM_CONCURRENT_TASKS = (typeof process.env.COA_MAXIMUM_CONCURRENT_TASKS === 'string')
    ? Number(process.env.COA_MAXIMUM_CONCURRENT_TASKS)
    : 0;

export default async () => {
    const connection = await connectMongo({ defaultConnection: false });

    let count = 0;

    const MAX_NUBMER_OF_PARALLEL_TASKS = COA_MAXIMUM_CONCURRENT_TASKS;
    const INTERVAL_MILLISECONDS = 100;

    setInterval(
        async () => {
            if (count > MAX_NUBMER_OF_PARALLEL_TASKS) {
                return;
            }

            count += 1;

            try {
                await chevre.service.task.executeByName({
                    name: <any>'importEventCapacitiesFromCOA'
                })({ connection: connection });
            } catch (error) {
                console.error(error);
            }

            count -= 1;
        },
        INTERVAL_MILLISECONDS
    );
};
