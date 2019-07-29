/**
 * 取引ルーター
 */
import { Router } from 'express';

import cancelReservationTransactionsRouter from './transactions/cancelReservation';
import reserveTransactionsRouter from './transactions/reserve';

const transactionsRouter = Router();
transactionsRouter.use('/cancelReservation', cancelReservationTransactionsRouter);
transactionsRouter.use('/reserve', reserveTransactionsRouter);
export default transactionsRouter;
