/**
 * COAオファーインポートタスク作成
 */
import * as chevre from '@chevre/domain';
import { CronJob } from 'cron';
import * as createDebug from 'debug';

import { connectMongo } from '../../../connectMongo';
import * as singletonProcess from '../../../singletonProcess';

const debug = createDebug('chevre-api:jobs');

const IMPORT_OFFERS_INTERVAL_IN_HOURS = (typeof process.env.IMPORT_OFFERS_INTERVAL_IN_HOURS === 'string')
    ? Number(process.env.IMPORT_OFFERS_INTERVAL_IN_HOURS)
    : 1;

export default async (params: {
    project: chevre.factory.project.IProject;
}) => {
    let holdSingletonProcess = false;
    setInterval(
        async () => {
            holdSingletonProcess = await singletonProcess.lock({
                project: params.project,
                key: 'createImportOffersTask',
                ttl: 60
            });
        },
        // tslint:disable-next-line:no-magic-numbers
        10000
    );

    const connection = await connectMongo({ defaultConnection: false });

    try {
        const job = new CronJob(
            `30 */${IMPORT_OFFERS_INTERVAL_IN_HOURS} * * *`,
            async () => {
                if (!holdSingletonProcess) {
                    return;
                }

                const taskRepo = new chevre.repository.Task(connection);
                const placeRepo = new chevre.repository.Place(connection);

                const movieTheaters = await placeRepo.searchMovieTheaters({
                    project: { id: { $eq: params.project.id } }
                });
                const now = new Date();
                const runsAt = now;

                await Promise.all(movieTheaters.map(async (movieTheater) => {
                    try {
                        const taskAttributes: chevre.factory.task.importOffersFromCOA.IAttributes = {
                            name: <any>chevre.factory.taskName.ImportOffersFromCOA,
                            status: chevre.factory.taskStatus.Ready,
                            runsAt: runsAt,
                            remainingNumberOfTries: 1,
                            numberOfTried: 0,
                            executionResults: [],
                            data: {
                                project: params.project,
                                theaterCode: movieTheater.branchCode
                            },
                            project: params.project
                        };
                        await taskRepo.save(taskAttributes);
                    } catch (error) {
                        console.error(error);
                    }
                }));
            },
            undefined,
            true
        );
        debug('job started', job.nextDate);
    } catch (error) {
        console.error('createImportOffersTask:', error);
    }
};
