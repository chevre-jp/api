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
 * 中止予約取引監視
 */
const chevre = require("@chevre/domain");
const connectMongo_1 = require("../../../connectMongo");
exports.default = () => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield connectMongo_1.connectMongo({ defaultConnection: false });
    let countExecute = 0;
    const MAX_NUBMER_OF_PARALLEL_TASKS = 10;
    const INTERVAL_MILLISECONDS = 500;
    const taskRepo = new chevre.repository.Task(connection);
    const transactionRepo = new chevre.repository.Transaction(connection);
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        if (countExecute > MAX_NUBMER_OF_PARALLEL_TASKS) {
            return;
        }
        countExecute += 1;
        try {
            yield chevre.service.transaction.reserve.exportTasks(chevre.factory.transactionStatusType.Canceled)({ task: taskRepo, transaction: transactionRepo });
        }
        catch (error) {
            console.error(error);
        }
        countExecute -= 1;
    }), INTERVAL_MILLISECONDS);
});
