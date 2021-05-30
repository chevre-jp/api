/**
 * 口座取引ルーター
 */
import * as chevre from '@chevre/domain';
import * as express from 'express';

import depositTransactionsRouter from './accountTransactions/deposit';
import transferTransactionsRouter from './accountTransactions/transfer';
import withdrawTransactionsRouter from './accountTransactions/withdraw';

const accountTransactionsRouter = express.Router();

accountTransactionsRouter.use(`/${chevre.factory.account.transactionType.Deposit}`, depositTransactionsRouter);
accountTransactionsRouter.use(`/${chevre.factory.account.transactionType.Withdraw}`, withdrawTransactionsRouter);
accountTransactionsRouter.use(`/${chevre.factory.account.transactionType.Transfer}`, transferTransactionsRouter);

export default accountTransactionsRouter;
