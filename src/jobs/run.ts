/**
 * 非同期ジョブ
 */
import abortTasks from './continuous/abortTasks/run';
import aggregateOnProject from './continuous/aggregateOnProject/run';
import aggregateScreeningEvent from './continuous/aggregateScreeningEvent/run';
import cancelPendingReservation from './continuous/cancelPendingReservation/run';
import cancelPoincancelReservationtAward from './continuous/cancelReservation/run';
import importEventCapacitiesFromCOA from './continuous/importEventCapacitiesFromCOA/run';
import importEventsFromCOA from './continuous/importEventsFromCOA/run';
import importOffersFromCOA from './continuous/importOffersFromCOA/run';
import makeTransactionExpired from './continuous/makeTransactionExpired/run';
import onCanceledCancelReservation from './continuous/onCanceledCancelReservation/run';
import onCanceledReserve from './continuous/onCanceledReserve/run';
import onConfirmedCancelReservation from './continuous/onConfirmedCancelReservation/run';
import onConfirmedReserve from './continuous/onConfirmedReserve/run';
import onExpiredCancelReservation from './continuous/onExpiredCancelReservation/run';
import onExpiredReserve from './continuous/onExpiredReserve/run';
import reexportTransactionTasks from './continuous/reexportTransactionTasks/run';
import reserve from './continuous/reserve/run';
import retryTasks from './continuous/retryTasks/run';
import triggerWebhook from './continuous/triggerWebhook/run';

import createImportEventCapacitiesTask from './triggered/createImportEventCapacitiesTask/run';
import createImportEventsTask from './triggered/createImportEventsTask/run';

const importEventsProjects = (typeof process.env.IMPORT_EVENTS_PROJECTS === 'string')
    ? process.env.IMPORT_EVENTS_PROJECTS.split(',')
    : [];

export default async () => {
    await abortTasks();
    await aggregateOnProject();
    await aggregateScreeningEvent();
    await cancelPendingReservation();
    await cancelPoincancelReservationtAward();
    await importEventCapacitiesFromCOA();
    await importEventsFromCOA();
    await importOffersFromCOA();
    await makeTransactionExpired();
    await onCanceledCancelReservation();
    await onCanceledReserve();
    await onConfirmedCancelReservation();
    await onConfirmedReserve();
    await onExpiredCancelReservation();
    await onExpiredReserve();
    await reexportTransactionTasks();
    await reserve();
    await retryTasks();
    await triggerWebhook();

    await Promise.all(importEventsProjects.map(async (projectId) => {
        await createImportEventsTask({ project: { typeOf: 'Project', id: projectId } });
        await createImportEventCapacitiesTask({ project: { typeOf: 'Project', id: projectId } });
    }));
};
