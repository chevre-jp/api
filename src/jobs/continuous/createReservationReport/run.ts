/**
 * 予約レポート作成
 */
import * as chevre from '@chevre/domain';

import { connectMongo } from '../../../connectMongo';

export default async () => {
    // 長時間処理の可能性があるので、disableCheck: true
    const connection = await connectMongo({
        defaultConnection: false,
        disableCheck: true
    });

    let count = 0;

    const MAX_NUBMER_OF_PARALLEL_TASKS = 0;
    const INTERVAL_MILLISECONDS = 10000;

    setInterval(
        async () => {
            if (count > MAX_NUBMER_OF_PARALLEL_TASKS) {
                return;
            }

            count += 1;

            try {
                await chevre.service.task.executeByName({
                    name: <any>'createReservationReport'
                })({
                    connection: connection
                });
            } catch (error) {
                console.error(error);
            }

            count -= 1;
        },
        INTERVAL_MILLISECONDS
    );
};
