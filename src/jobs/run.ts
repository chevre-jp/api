/**
 * 非同期ジョブ
 */
import abortTasks from './continuous/abortTasks/run';
import aggregateScreeningEvent from './continuous/aggregateScreeningEvent/run';
import cancelPendingReservation from './continuous/cancelPendingReservation/run';
import cancelPoincancelReservationtAward from './continuous/cancelReservation/run';
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
import createSampleScreeningEvents from './triggered/createSampleScreeningEvents/run';

export default async () => {
    await abortTasks();
    await aggregateScreeningEvent();
    await cancelPendingReservation();
    await cancelPoincancelReservationtAward();
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

    await createSampleScreeningEvents();
};
