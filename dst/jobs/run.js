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
const chevre = require("@chevre/domain");
const run_1 = require("./continuous/abortTasks/run");
const run_2 = require("./continuous/aggregateOnProject/run");
const run_3 = require("./continuous/aggregateScreeningEvent/run");
const run_4 = require("./continuous/cancelMoneyTransfer/run");
const run_5 = require("./continuous/cancelPendingReservation/run");
const run_6 = require("./continuous/cancelReservation/run");
const run_7 = require("./continuous/importEventCapacitiesFromCOA/run");
const run_8 = require("./continuous/importEventsFromCOA/run");
const run_9 = require("./continuous/importOffersFromCOA/run");
const run_10 = require("./continuous/makeTransactionExpired/run");
const run_11 = require("./continuous/moneyTransfer/run");
const run_12 = require("./continuous/onCanceledCancelReservation/run");
const run_13 = require("./continuous/onCanceledMoneyTransfer/run");
const run_14 = require("./continuous/onCanceledRegisterService/run");
const run_15 = require("./continuous/onCanceledReserve/run");
const run_16 = require("./continuous/onConfirmedCancelReservation/run");
const run_17 = require("./continuous/onConfirmedMoneyTransfer/run");
const run_18 = require("./continuous/onConfirmedRegisterService/run");
const run_19 = require("./continuous/onConfirmedReserve/run");
const run_20 = require("./continuous/onExpiredCancelReservation/run");
const run_21 = require("./continuous/onExpiredMoneyTransfer/run");
const run_22 = require("./continuous/onExpiredRegisterService/run");
const run_23 = require("./continuous/onExpiredReserve/run");
const run_24 = require("./continuous/reexportTransactionTasks/run");
const run_25 = require("./continuous/registerService/run");
const run_26 = require("./continuous/reserve/run");
const run_27 = require("./continuous/retryTasks/run");
const run_28 = require("./continuous/triggerWebhook/run");
const run_29 = require("./triggered/createImportEventCapacitiesTask/run");
const run_30 = require("./triggered/createImportEventsTask/run");
const run_31 = require("./triggered/createImportOffersTask/run");
const run_32 = require("./triggered/createTopDeckEvents/run");
const importEventsProjects = (typeof process.env.IMPORT_EVENTS_PROJECTS === 'string')
    ? process.env.IMPORT_EVENTS_PROJECTS.split(',')
    : [];
const TOPDECK_PROJECT = process.env.TOPDECK_PROJECT;
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
    yield run_24.default();
    yield run_25.default();
    yield run_26.default();
    yield run_27.default();
    yield run_28.default();
    yield Promise.all(importEventsProjects.map((projectId) => __awaiter(void 0, void 0, void 0, function* () {
        yield run_30.default({ project: { typeOf: chevre.factory.organizationType.Project, id: projectId } });
        yield run_29.default({ project: { typeOf: chevre.factory.organizationType.Project, id: projectId } });
        yield run_31.default({ project: { typeOf: chevre.factory.organizationType.Project, id: projectId } });
    })));
    if (typeof TOPDECK_PROJECT === 'string') {
        yield run_32.default({
            project: { typeOf: chevre.factory.organizationType.Project, id: TOPDECK_PROJECT }
        });
    }
});
