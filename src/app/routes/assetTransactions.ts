/**
 * 取引ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { query } from 'express-validator';
import * as mongoose from 'mongoose';

import cancelReservationTransactionsRouter from './transactions/cancelReservation';
import moneyTransferTransactionsRouter from './transactions/moneyTransfer';
import payTransactionsRouter from './transactions/pay';
import refundTransactionsRouter from './transactions/refund';
import registerServiceTransactionsRouter from './transactions/registerService';
import reserveTransactionsRouter from './transactions/reserve';

import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const assetTransactionsRouter = Router();

assetTransactionsRouter.use('/cancelReservation', cancelReservationTransactionsRouter);
assetTransactionsRouter.use(`/${chevre.factory.assetTransactionType.MoneyTransfer}`, moneyTransferTransactionsRouter);
assetTransactionsRouter.use(`/${chevre.factory.assetTransactionType.Pay}`, payTransactionsRouter);
assetTransactionsRouter.use(`/${chevre.factory.assetTransactionType.Refund}`, refundTransactionsRouter);
assetTransactionsRouter.use('/reserve', reserveTransactionsRouter);
assetTransactionsRouter.use(`/${chevre.factory.assetTransactionType.RegisterService}`, registerServiceTransactionsRouter);

/**
 * 取引検索
 */
assetTransactionsRouter.get(
    '',
    permitScopes([]),
    ...[
        query('limit')
            .optional()
            .isInt()
            .toInt(),
        query('page')
            .optional()
            .isInt()
            .toInt(),
        query('startFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('startThrough')
            .optional()
            .isISO8601()
            .toDate(),
        query('endFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('endThrough')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
            const searchConditions: chevre.factory.assetTransaction.ISearchConditions<chevre.factory.assetTransactionType> = {
                ...req.query,
                project: { ids: [req.project.id] },
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
                sort: { startDate: chevre.factory.sortType.Descending }
            };

            const transactions = await transactionRepo.search(searchConditions);

            res.json(transactions);
        } catch (error) {
            next(error);
        }
    }
);

export default assetTransactionsRouter;
