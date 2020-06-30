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
 * COA券種インポートタスク実行
 */
const chevre = require("@chevre/domain");
const connectMongo_1 = require("../../../connectMongo");
const COA_MAXIMUM_CONCURRENT_TASKS = (typeof process.env.COA_MAXIMUM_CONCURRENT_TASKS === 'string')
    ? Number(process.env.COA_MAXIMUM_CONCURRENT_TASKS)
    : 0;
exports.default = () => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield connectMongo_1.connectMongo({ defaultConnection: false });
    let count = 0;
    const MAX_NUBMER_OF_PARALLEL_TASKS = COA_MAXIMUM_CONCURRENT_TASKS;
    const INTERVAL_MILLISECONDS = 100;
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        if (count > MAX_NUBMER_OF_PARALLEL_TASKS) {
            return;
        }
        count += 1;
        try {
            yield chevre.service.task.executeByName({
                name: chevre.factory.taskName.ImportOffersFromCOA
            })({ connection: connection });
        }
        catch (error) {
            console.error(error);
        }
        count -= 1;
    }), INTERVAL_MILLISECONDS);
});
