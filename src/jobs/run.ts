/**
 * 非同期ジョブ
 */
import * as chevre from '@chevre/domain';

import onTransactionCanceled from './continuous/onTransactionCanceled/run';
import onTransactionConfirmed from './continuous/onTransactionConfirmed/run';
import onTransactionExpired from './continuous/onTransactionExpired/run';

import abortTasks from './continuous/abortTasks/run';
import aggregateOnProject from './continuous/aggregateOnProject/run';
import aggregateScreeningEvent from './continuous/aggregateScreeningEvent/run';
import cancelMoneyTransfer from './continuous/cancelMoneyTransfer/run';
import cancelPendingReservation from './continuous/cancelPendingReservation/run';
import cancelPoincancelReservationtAward from './continuous/cancelReservation/run';
import createReservationReport from './continuous/createReservationReport/run';
import importEventCapacitiesFromCOA from './continuous/importEventCapacitiesFromCOA/run';
import importEventsFromCOA from './continuous/importEventsFromCOA/run';
import importOffersFromCOA from './continuous/importOffersFromCOA/run';
import makeTransactionExpired from './continuous/makeTransactionExpired/run';
import moneyTransfer from './continuous/moneyTransfer/run';
import pay from './continuous/pay/run';
import reexportTransactionTasks from './continuous/reexportTransactionTasks/run';
import refund from './continuous/refund/run';
import registerService from './continuous/registerService/run';
import reserve from './continuous/reserve/run';
import retryTasks from './continuous/retryTasks/run';
import sendEmailMessage from './continuous/sendEmailMessage/run';
import triggerWebhook from './continuous/triggerWebhook/run';
import voidPayment from './continuous/voidPayment/run';

import createImportEventCapacitiesTask from './triggered/createImportEventCapacitiesTask/run';
import createImportEventsTask from './triggered/createImportEventsTask/run';
import createImportOffersTask from './triggered/createImportOffersTask/run';
import createTopDeckEvents from './triggered/createTopDeckEvents/run';

const importEventsProjects = (typeof process.env.IMPORT_EVENTS_PROJECTS === 'string')
    ? process.env.IMPORT_EVENTS_PROJECTS.split(',')
    : [];

const TOPDECK_PROJECT = process.env.TOPDECK_PROJECT;
const USE_CRON = process.env.USE_CRON === '1';

export default async () => {
    await onTransactionCanceled();
    await onTransactionConfirmed();
    await onTransactionExpired();

    await abortTasks();
    await aggregateOnProject();
    await aggregateScreeningEvent();
    await cancelMoneyTransfer();
    await cancelPendingReservation();
    await cancelPoincancelReservationtAward();
    await createReservationReport();
    await importEventCapacitiesFromCOA();
    await importEventsFromCOA();
    await importOffersFromCOA();
    await makeTransactionExpired();
    await moneyTransfer();
    await pay();
    await reexportTransactionTasks();
    await refund();
    await registerService();
    await reserve();
    await retryTasks();
    await sendEmailMessage();
    await triggerWebhook();
    await voidPayment();

    await Promise.all(importEventsProjects.map(async (projectId) => {
        await createImportEventsTask({ project: { typeOf: chevre.factory.organizationType.Project, id: projectId } });
        await createImportEventCapacitiesTask({ project: { typeOf: chevre.factory.organizationType.Project, id: projectId } });
    }));

    if (!USE_CRON) {
        await Promise.all(importEventsProjects.map(async (projectId) => {
            await createImportOffersTask({ project: { typeOf: chevre.factory.organizationType.Project, id: projectId } });
        }));

        if (typeof TOPDECK_PROJECT === 'string') {
            await createTopDeckEvents({
                project: { typeOf: chevre.factory.organizationType.Project, id: TOPDECK_PROJECT }
            });
        }
    }
};
