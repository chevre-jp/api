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
 * イベントインポートタスク作成
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
const MAX_IMPORT_EVENTS_INTERVAL_IN_MINUTES = 60;
exports.default = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    let holdSingletonProcess = false;
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        holdSingletonProcess = yield singletonProcess.lock({
            project: params.project,
            key: 'createImportEventsTask',
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
        const importEventsIntervalInMinutes = (typeof ((_c = project.settings) === null || _c === void 0 ? void 0 : _c.importEventsIntervalInMinutes) === 'number')
            ? Math.min(Number((_d = project.settings) === null || _d === void 0 ? void 0 : _d.importEventsIntervalInMinutes), MAX_IMPORT_EVENTS_INTERVAL_IN_MINUTES)
            // tslint:disable-next-line:no-magic-numbers
            : MAX_IMPORT_EVENTS_INTERVAL_IN_MINUTES;
        debug('importEventsIntervalInMinutes:', importEventsIntervalInMinutes);
        const job = new cron_1.CronJob(
        // `*/${importEventsIntervalInMinutes} * * * *`,
        '45 * * * *', 
        // tslint:disable-next-line:max-func-body-length
        () => __awaiter(void 0, void 0, void 0, function* () {
            if (!holdSingletonProcess) {
                return;
            }
            const taskRepo = new chevre.repository.Task(connection);
            const placeRepo = new chevre.repository.Place(connection);
            const movieTheaters = yield placeRepo.searchMovieTheaters({
                project: { id: { $eq: params.project.id } }
            });
            const now = new Date();
            const runsAt = now;
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
        console.error('createImportEventsTask:', error);
    }
});
