/**
 * イベントインポートタスク作成
 */
import * as chevre from '@chevre/domain';
import { CronJob } from 'cron';
import * as createDebug from 'debug';
import * as moment from 'moment';

import { connectMongo } from '../../../connectMongo';
import * as singletonProcess from '../../../singletonProcess';

const debug = createDebug('chevre-api:jobs');

const IMPORT_EVENTS_PER_DAYS = 3;
const DAYS_WEEK = 7;

const MAX_IMPORT_EVENTS_INTERVAL_IN_MINUTES = 60;

export default async (params: {
    project: chevre.factory.project.IProject;
}) => {
    let holdSingletonProcess = false;
    setInterval(
        async () => {
            holdSingletonProcess = await singletonProcess.lock({
                project: params.project,
                key: 'createImportEventsTask',
                ttl: 60
            });
        },
        // tslint:disable-next-line:no-magic-numbers
        10000
    );

    const connection = await connectMongo({ defaultConnection: false });

    try {
        const projectRepo = new chevre.repository.Project(connection);
        const project = await projectRepo.findById({ id: params.project.id });
        const importEventsInWeeks = (typeof project.settings?.importEventsInWeeks === 'number')
            ? project.settings?.importEventsInWeeks : 1;
        const importEventsIntervalInMinutes = (typeof (<any>project).settings?.importEventsIntervalInMinutes === 'number')
            ? Math.min(Number((<any>project).settings?.importEventsIntervalInMinutes), MAX_IMPORT_EVENTS_INTERVAL_IN_MINUTES)
            // tslint:disable-next-line:no-magic-numbers
            : MAX_IMPORT_EVENTS_INTERVAL_IN_MINUTES;
        debug('importEventsIntervalInMinutes:', importEventsIntervalInMinutes);

        const job = new CronJob(
            // `*/${importEventsIntervalInMinutes} * * * *`,
            '45 * * * *',
            // tslint:disable-next-line:max-func-body-length
            async () => {
                if (!holdSingletonProcess) {
                    return;
                }

                const taskRepo = new chevre.repository.Task(connection);
                const placeRepo = new chevre.repository.Place(connection);

                const movieTheaters = await placeRepo.searchMovieTheaters({
                    project: { ids: [params.project.id] }
                });
                const now = new Date();
                const runsAt = now;

                // IMPORT_EVENTS_PER_DAYSずつインポート
                // tslint:disable-next-line:prefer-array-literal
                await Promise.all([...Array(Math.ceil(importEventsInWeeks * DAYS_WEEK / IMPORT_EVENTS_PER_DAYS))].map(async (_, i) => {
                    const importFrom = moment(now)
                        .add(i * IMPORT_EVENTS_PER_DAYS, 'days')
                        .toDate();
                    const importThrough = moment(importFrom)
                        .add(IMPORT_EVENTS_PER_DAYS, 'days')
                        .toDate();

                    await Promise.all(movieTheaters.map(async (movieTheater) => {
                        try {
                            const taskAttributes: chevre.factory.task.importEventsFromCOA.IAttributes = {
                                name: chevre.factory.taskName.ImportEventsFromCOA,
                                status: chevre.factory.taskStatus.Ready,
                                runsAt: runsAt,
                                remainingNumberOfTries: 1,
                                numberOfTried: 0,
                                executionResults: [],
                                data: {
                                    project: params.project,
                                    locationBranchCode: movieTheater.branchCode,
                                    importFrom: importFrom,
                                    importThrough: importThrough
                                },
                                project: params.project
                            };
                            await taskRepo.save(taskAttributes);
                        } catch (error) {
                            console.error(error);
                        }
                    }));
                }));
            },
            undefined,
            true
        );
        debug('job started', job.nextDate);
    } catch (error) {
        console.error('createImportEventsTask:', error);
    }
};
