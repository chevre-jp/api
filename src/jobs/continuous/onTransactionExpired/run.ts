/**
 * 期限切れ取引監視
 */
import * as chevre from '@chevre/domain';

import { connectMongo } from '../../../connectMongo';

const RUNS_TASKS_AFTER_IN_SECONDS = 120;

export default async () => {
    const connection = await connectMongo({ defaultConnection: false });

    let countExecute = 0;

    const MAX_NUBMER_OF_PARALLEL_TASKS = 10;
    const INTERVAL_MILLISECONDS = 200;

    const projectRepo = new chevre.repository.Project(connection);
    const taskRepo = new chevre.repository.Task(connection);
    const transactionRepo = new chevre.repository.AssetTransaction(connection);

    setInterval(
        async () => {
            if (countExecute > MAX_NUBMER_OF_PARALLEL_TASKS) {
                return;
            }

            countExecute += 1;

            try {
                await chevre.service.transaction.exportTasks({
                    status: chevre.factory.transactionStatusType.Expired,
                    typeOf: {
                        $in: [
                            chevre.factory.transactionType.CancelReservation,
                            chevre.factory.transactionType.MoneyTransfer,
                            chevre.factory.transactionType.Pay,
                            chevre.factory.transactionType.Refund,
                            chevre.factory.transactionType.RegisterService,
                            chevre.factory.transactionType.Reserve
                        ]
                    },
                    runsTasksAfterInSeconds: RUNS_TASKS_AFTER_IN_SECONDS
                })({
                    project: projectRepo,
                    task: taskRepo,
                    transaction: transactionRepo
                });
            } catch (error) {
                console.error(error);
            }

            countExecute -= 1;
        },
        INTERVAL_MILLISECONDS
    );
};
