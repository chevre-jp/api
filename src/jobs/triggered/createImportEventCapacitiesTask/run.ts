/**
 * COAイベント席数更新タスク作成
 */
import * as chevre from '@chevre/domain';
import { CronJob } from 'cron';
import * as createDebug from 'debug';
import * as moment from 'moment';

import { connectMongo } from '../../../connectMongo';
import * as singletonProcess from '../../../singletonProcess';

const debug = createDebug('cinerino-api:jobs');

const IMPORT_EVENTS_PER_WEEKS = 1;

// tslint:disable-next-line:max-func-body-length
export default async (params: {
    project: chevre.factory.project.IProject;
}) => {
    let holdSingletonProcess = false;
    setInterval(
        async () => {
            holdSingletonProcess = await singletonProcess.lock({
                project: params.project,
                key: 'createImportEventCapacitiesTask',
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
        const importEventsInWeeks = (typeof (<any>project).settings?.importEventsInWeeks === 'number')
            ? (<any>project).settings?.importEventsInWeeks : 1;

        const job = new CronJob(
            `* * * * *`,
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

                // 1週間ずつインポート
                // tslint:disable-next-line:prefer-array-literal
                await Promise.all([...Array(Math.ceil(importEventsInWeeks / IMPORT_EVENTS_PER_WEEKS))].map(async (_, i) => {
                    const importFrom = moment(now)
                        .add(i, 'weeks')
                        .toDate();
                    const importThrough = moment(importFrom)
                        .add(IMPORT_EVENTS_PER_WEEKS, 'weeks')
                        .toDate();

                    await Promise.all(movieTheaters.map(async (movieTheater) => {
                        try {
                            const taskAttributes: chevre.factory.task.IAttributes = {
                                name: <any>'importEventCapacitiesFromCOA',
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
        debug('job started', job);
    } catch (error) {
        console.error('createImportEventCapacitiesTask:', error);

    }
};