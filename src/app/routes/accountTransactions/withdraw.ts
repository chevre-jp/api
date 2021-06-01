/**
 * 出金取引ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { NO_CONTENT } from 'http-status';

import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const pecorinoAuthClient = new chevre.pecorinoapi.auth.ClientCredentials({
    domain: chevre.credentials.pecorino.authorizeServerDomain,
    clientId: chevre.credentials.pecorino.clientId,
    clientSecret: chevre.credentials.pecorino.clientSecret,
    scopes: [],
    state: ''
});

const withdrawTransactionsRouter = Router();

withdrawTransactionsRouter.post(
    '/start',
    permitScopes([]),
    ...[
    ],
    validator,
    async (req, res, next) => {
        try {
            const withdrawService = new chevre.pecorinoapi.service.transaction.Withdraw({
                endpoint: chevre.credentials.pecorino.endpoint,
                auth: pecorinoAuthClient
            });
            const transaction = await withdrawService.start(req.body);

            // tslint:disable-next-line:no-string-literal
            // const host = req.headers['host'];
            // res.setHeader('Location', `https://${host}/transactions/${transaction.id}`);
            res.json(transaction);
        } catch (error) {
            next(error);
        }
    }
);

withdrawTransactionsRouter.put(
    '/:transactionId/confirm',
    permitScopes([]),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            const withdrawService = new chevre.pecorinoapi.service.transaction.Withdraw({
                endpoint: chevre.credentials.pecorino.endpoint,
                auth: pecorinoAuthClient
            });
            await withdrawService.confirm({
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

withdrawTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes([]),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            const withdrawService = new chevre.pecorinoapi.service.transaction.Withdraw({
                endpoint: chevre.credentials.pecorino.endpoint,
                auth: pecorinoAuthClient
            });
            await withdrawService.cancel({
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default withdrawTransactionsRouter;
