/**
 * 取引ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';

import cancelReservationTransactionsRouter from './transactions/cancelReservation';
import registerProgramMembershipTransactionsRouter from './transactions/registerProgramMembership';
import reserveTransactionsRouter from './transactions/reserve';

const transactionsRouter = Router();
transactionsRouter.use('/cancelReservation', cancelReservationTransactionsRouter);
transactionsRouter.use('/reserve', reserveTransactionsRouter);
transactionsRouter.use(`/${chevre.factory.transactionType.RegisterProgramMembership}`, registerProgramMembershipTransactionsRouter);
export default transactionsRouter;
