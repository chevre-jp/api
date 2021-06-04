"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * COAイベント席数更新タスク作成
 */
const chevre = require("@chevre/domain");
const cron_1 = require("cron");
const createDebug = require("debug");
const moment = require("moment");
const connectMongo_1 = require("../../../connectMongo");
const singletonProcess = require("../../../singletonProcess");
const debug = createDebug('chevre-api:jobs');
const IMPORT_EVENTS_PER_DAYS = 3;
const DAYS_WEEK = 7;
// tslint:disable-next-line:max-func-body-length
exports.default = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let holdSingletonProcess = false;
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        holdSingletonProcess = yield singletonProcess.lock({
            project: params.project,
            key: 'createImportEventCapacitiesTask',
            ttl: 60
        });
    }), 
    // tslint:disable-next-line:no-magic-numbers
    10000);
    const connection = yield connectMongo_1.connectMongo({ defaultConnection: false });
    try {
        const projectRepo = new chevre.repository.Project(connection);
        const project = yield projectRepo.findById({ id: params.project.id });
        const importEventsInWeeks = (typeof ((_a = project.settings) === null || _a === void 0 ? void 0 : _a.importEventsInWeeks) === 'number')
            ? (_b = project.settings) === null || _b === void 0 ? void 0 : _b.importEventsInWeeks : 1;
        const job = new cron_1.CronJob(`* * * * *`, () => __awaiter(void 0, void 0, void 0, function* () {
            if (!holdSingletonProcess) {
                return;
            }
            const taskRepo = new chevre.repository.Task(connection);
            const placeRepo = new chevre.repository.Place(connection);
            const movieTheaters = yield placeRepo.searchMovieTheaters({
                project: { ids: [params.project.id] }
            });
            const now = new Date();
            const runsAt = now;
            // 過去のタスクでいまだに実行されていないものを中止
            yield taskRepo.taskModel.updateMany({
                name: chevre.factory.taskName.ImportEventCapacitiesFromCOA,
                status: chevre.factory.taskStatus.Ready,
                runsAt: { $lt: runsAt }
            }, { status: chevre.factory.taskStatus.Aborted })
                .exec();
            // IMPORT_EVENTS_PER_DAYSずつインポート
            // tslint:disable-next-line:prefer-array-literal
            yield Promise.all([...Array(Math.ceil(importEventsInWeeks * DAYS_WEEK / IMPORT_EVENTS_PER_DAYS))].map((_, i) => __awaiter(void 0, void 0, void 0, function* () {
                const importFrom = moment(now)
                    .add(i * IMPORT_EVENTS_PER_DAYS, 'days')
                    .toDate();
                const importThrough = moment(importFrom)
                    .add(IMPORT_EVENTS_PER_DAYS, 'days')
                    .toDate();
                yield Promise.all(movieTheaters.map((movieTheater) => __awaiter(void 0, void 0, void 0, function* () {
                    try {
                        const taskAttributes = {
                            name: chevre.factory.taskName.ImportEventCapacitiesFromCOA,
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
                        yield taskRepo.save(taskAttributes);
                    }
                    catch (error) {
                        console.error(error);
                    }
                })));
            })));
        }), undefined, true);
        debug('job started', job.nextDate);
    }
    catch (error) {
        console.error('createImportEventCapacitiesTask:', error);
    }
});
