/**
 * 中止予約キャンセル取引監視
 */
import * as chevre from '@chevre/domain';

import { connectMongo } from '../../../connectMongo';

export default async () => {
    const connection = await connectMongo({ defaultConnection: false });

    let countExecute = 0;

    const MAX_NUBMER_OF_PARALLEL_TASKS = 10;
    const INTERVAL_MILLISECONDS = 500;
    const taskRepo = new chevre.repository.Task(connection);
    const transactionRepo = new chevre.repository.Transaction(connection);

    setInterval(
        async () => {
            if (countExecute > MAX_NUBMER_OF_PARALLEL_TASKS) {
                return;
            }

            countExecute += 1;

            try {
                await chevre.service.transaction.cancelReservation.exportTasks(
                    chevre.factory.transactionStatusType.Canceled
                )({ task: taskRepo, transaction: transactionRepo });
            } catch (error) {
                console.error(error);
            }

            countExecute -= 1;
        },
        INTERVAL_MILLISECONDS
    );
};
