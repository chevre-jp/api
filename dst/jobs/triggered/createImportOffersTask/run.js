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
 * COAオファーインポートタスク作成
 */
const chevre = require("@chevre/domain");
const cron_1 = require("cron");
const createDebug = require("debug");
const connectMongo_1 = require("../../../connectMongo");
const singletonProcess = require("../../../singletonProcess");
const debug = createDebug('chevre-api:jobs');
exports.default = (params) => __awaiter(void 0, void 0, void 0, function* () {
    let holdSingletonProcess = false;
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        holdSingletonProcess = yield singletonProcess.lock({
            project: params.project,
            key: 'createImportOffersTask',
            ttl: 60
        });
    }), 
    // tslint:disable-next-line:no-magic-numbers
    10000);
    const connection = yield connectMongo_1.connectMongo({ defaultConnection: false });
    try {
        const job = new cron_1.CronJob('*/60 * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
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
            yield Promise.all(movieTheaters.map((movieTheater) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const taskAttributes = {
                        name: chevre.factory.taskName.ImportOffersFromCOA,
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
                    yield taskRepo.save(taskAttributes);
                }
                catch (error) {
                    console.error(error);
                }
            })));
        }), undefined, true);
        debug('job started', job.nextDate);
    }
    catch (error) {
        console.error('createImportOffersTask:', error);
    }
});
