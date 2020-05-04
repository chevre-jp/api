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
 * 非同期ジョブ
 */
const run_1 = require("./continuous/abortTasks/run");
const run_2 = require("./continuous/aggregateOnProject/run");
const run_3 = require("./continuous/aggregateScreeningEvent/run");
const run_4 = require("./continuous/cancelPendingReservation/run");
const run_5 = require("./continuous/cancelReservation/run");
const run_6 = require("./continuous/importEventCapacitiesFromCOA/run");
const run_7 = require("./continuous/importEventsFromCOA/run");
const run_8 = require("./continuous/importOffersFromCOA/run");
const run_9 = require("./continuous/makeTransactionExpired/run");
const run_10 = require("./continuous/onCanceledCancelReservation/run");
const run_11 = require("./continuous/onCanceledRegisterService/run");
const run_12 = require("./continuous/onCanceledReserve/run");
const run_13 = require("./continuous/onConfirmedCancelReservation/run");
const run_14 = require("./continuous/onConfirmedRegisterService/run");
const run_15 = require("./continuous/onConfirmedReserve/run");
const run_16 = require("./continuous/onExpiredCancelReservation/run");
const run_17 = require("./continuous/onExpiredRegisterService/run");
const run_18 = require("./continuous/onExpiredReserve/run");
const run_19 = require("./continuous/reexportTransactionTasks/run");
const run_20 = require("./continuous/registerService/run");
const run_21 = require("./continuous/reserve/run");
const run_22 = require("./continuous/retryTasks/run");
const run_23 = require("./continuous/triggerWebhook/run");
const run_24 = require("./triggered/createImportEventCapacitiesTask/run");
const run_25 = require("./triggered/createImportEventsTask/run");
const run_26 = require("./triggered/createImportOffersTask/run");
const importEventsProjects = (typeof process.env.IMPORT_EVENTS_PROJECTS === 'string')
    ? process.env.IMPORT_EVENTS_PROJECTS.split(',')
    : [];
exports.default = () => __awaiter(void 0, void 0, void 0, function* () {
    yield run_1.default();
    yield run_2.default();
    yield run_3.default();
    yield run_4.default();
    yield run_5.default();
    yield run_6.default();
    yield run_7.default();
    yield run_8.default();
    yield run_9.default();
    yield run_10.default();
    yield run_11.default();
    yield run_12.default();
    yield run_13.default();
    yield run_14.default();
    yield run_15.default();
    yield run_16.default();
    yield run_17.default();
    yield run_18.default();
    yield run_19.default();
    yield run_20.default();
    yield run_21.default();
    yield run_22.default();
    yield run_23.default();
    yield Promise.all(importEventsProjects.map((projectId) => __awaiter(void 0, void 0, void 0, function* () {
        yield run_25.default({ project: { typeOf: 'Project', id: projectId } });
        yield run_24.default({ project: { typeOf: 'Project', id: projectId } });
        yield run_26.default({ project: { typeOf: 'Project', id: projectId } });
    })));
});
