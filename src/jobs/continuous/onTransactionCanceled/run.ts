/**
 * 中止取引監視
 */
import * as chevre from '@chevre/domain';

import { connectMongo } from '../../../connectMongo';

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
                    status: chevre.factory.transactionStatusType.Canceled,
                    typeOf: {
                        $in: [
                            chevre.factory.assetTransactionType.CancelReservation,
                            chevre.factory.assetTransactionType.MoneyTransfer,
                            chevre.factory.assetTransactionType.Pay,
                            chevre.factory.assetTransactionType.Refund,
                            chevre.factory.assetTransactionType.RegisterService,
                            chevre.factory.assetTransactionType.Reserve
                        ]
                    }
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
