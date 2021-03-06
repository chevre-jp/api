/**
 * 取引期限監視
 */
import * as chevre from '@chevre/domain';
import * as moment from 'moment';

import { connectMongo } from '../../../connectMongo';

export default async () => {
    const connection = await connectMongo({ defaultConnection: false });

    let count = 0;

    const MAX_NUBMER_OF_PARALLEL_TASKS = 10;
    const INTERVAL_MILLISECONDS = 500;
    const transactionRepo = new chevre.repository.AssetTransaction(connection);

    setInterval(
        async () => {
            if (count > MAX_NUBMER_OF_PARALLEL_TASKS) {
                return;
            }

            count += 1;

            try {
                await transactionRepo.makeExpired();

                // 過去の不要な取引を削除
                await transactionRepo.transactionModel.deleteMany({
                    startDate: {
                        $lt: moment()
                            // tslint:disable-next-line:no-magic-numbers
                            .add(-7, 'days')
                            .toDate()
                    },
                    status: { $in: [chevre.factory.transactionStatusType.Canceled, chevre.factory.transactionStatusType.Expired] },
                    tasksExportationStatus: chevre.factory.transactionTasksExportationStatus.Exported
                })
                    .exec();
            } catch (error) {
                console.error(error);
            }

            count -= 1;
        },
        INTERVAL_MILLISECONDS
    );
};
