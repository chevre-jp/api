/**
 * 取引ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';

import cancelReservationTransactionsRouter from './transactions/cancelReservation';
import moneyTransferTransactionsRouter from './transactions/moneyTransfer';
import payTransactionsRouter from './transactions/pay';
import registerServiceTransactionsRouter from './transactions/registerService';
import reserveTransactionsRouter from './transactions/reserve';

const transactionsRouter = Router();
transactionsRouter.use('/cancelReservation', cancelReservationTransactionsRouter);
transactionsRouter.use(`/${chevre.factory.transactionType.MoneyTransfer}`, moneyTransferTransactionsRouter);
transactionsRouter.use(`/${chevre.factory.transactionType.Pay}`, payTransactionsRouter);
transactionsRouter.use('/reserve', reserveTransactionsRouter);
transactionsRouter.use(`/${chevre.factory.transactionType.RegisterService}`, registerServiceTransactionsRouter);
export default transactionsRouter;
