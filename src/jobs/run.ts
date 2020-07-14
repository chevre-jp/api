/**
 * 非同期ジョブ
 */
import * as chevre from '@chevre/domain';

import abortTasks from './continuous/abortTasks/run';
import aggregateOnProject from './continuous/aggregateOnProject/run';
import aggregateScreeningEvent from './continuous/aggregateScreeningEvent/run';
import cancelMoneyTransfer from './continuous/cancelMoneyTransfer/run';
import cancelPendingReservation from './continuous/cancelPendingReservation/run';
import cancelPoincancelReservationtAward from './continuous/cancelReservation/run';
import importEventCapacitiesFromCOA from './continuous/importEventCapacitiesFromCOA/run';
import importEventsFromCOA from './continuous/importEventsFromCOA/run';
import importOffersFromCOA from './continuous/importOffersFromCOA/run';
import makeTransactionExpired from './continuous/makeTransactionExpired/run';
import moneyTransfer from './continuous/moneyTransfer/run';
import onCanceledCancelReservation from './continuous/onCanceledCancelReservation/run';
import onCanceledMoneyTransfer from './continuous/onCanceledMoneyTransfer/run';
import onCanceledRegisterService from './continuous/onCanceledRegisterService/run';
import onCanceledReserve from './continuous/onCanceledReserve/run';
import onConfirmedCancelReservation from './continuous/onConfirmedCancelReservation/run';
import onConfirmedMoneyTransfer from './continuous/onConfirmedMoneyTransfer/run';
import onConfirmedRegisterService from './continuous/onConfirmedRegisterService/run';
import onConfirmedReserve from './continuous/onConfirmedReserve/run';
import onExpiredCancelReservation from './continuous/onExpiredCancelReservation/run';
import onExpiredMoneyTransfer from './continuous/onExpiredMoneyTransfer/run';
import onExpiredRegisterService from './continuous/onExpiredRegisterService/run';
import onExpiredReserve from './continuous/onExpiredReserve/run';
import reexportTransactionTasks from './continuous/reexportTransactionTasks/run';
import registerService from './continuous/registerService/run';
import reserve from './continuous/reserve/run';
import retryTasks from './continuous/retryTasks/run';
import triggerWebhook from './continuous/triggerWebhook/run';

import createImportEventCapacitiesTask from './triggered/createImportEventCapacitiesTask/run';
import createImportEventsTask from './triggered/createImportEventsTask/run';
import createImportOffersTask from './triggered/createImportOffersTask/run';
import createTopDeckEvents from './triggered/createTopDeckEvents/run';

const importEventsProjects = (typeof process.env.IMPORT_EVENTS_PROJECTS === 'string')
    ? process.env.IMPORT_EVENTS_PROJECTS.split(',')
    : [];

const TOPDECK_PROJECT = process.env.TOPDECK_PROJECT;

export default async () => {
    await abortTasks();
    await aggregateOnProject();
    await aggregateScreeningEvent();
    await cancelMoneyTransfer();
    await cancelPendingReservation();
    await cancelPoincancelReservationtAward();
    await importEventCapacitiesFromCOA();
    await importEventsFromCOA();
    await importOffersFromCOA();
    await makeTransactionExpired();
    await moneyTransfer();
    await onCanceledCancelReservation();
    await onCanceledMoneyTransfer();
    await onCanceledRegisterService();
    await onCanceledReserve();
    await onConfirmedCancelReservation();
    await onConfirmedMoneyTransfer();
    await onConfirmedRegisterService();
    await onConfirmedReserve();
    await onExpiredCancelReservation();
    await onExpiredMoneyTransfer();
    await onExpiredRegisterService();
    await onExpiredReserve();
    await reexportTransactionTasks();
    await registerService();
    await reserve();
    await retryTasks();
    await triggerWebhook();

    await Promise.all(importEventsProjects.map(async (projectId) => {
        await createImportEventsTask({ project: { typeOf: chevre.factory.organizationType.Project, id: projectId } });
        await createImportEventCapacitiesTask({ project: { typeOf: chevre.factory.organizationType.Project, id: projectId } });
        await createImportOffersTask({ project: { typeOf: chevre.factory.organizationType.Project, id: projectId } });
    }));

    if (typeof TOPDECK_PROJECT === 'string') {
        await createTopDeckEvents({
            project: { typeOf: chevre.factory.organizationType.Project, id: TOPDECK_PROJECT }
        });
    }
};
