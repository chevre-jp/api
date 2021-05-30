/**
 * 入金取引ルーター
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

const depositTransactionsRouter = Router();

depositTransactionsRouter.post(
    '/start',
    permitScopes([]),
    ...[
    ],
    validator,
    async (req, res, next) => {
        try {
            const depositService = new chevre.pecorinoapi.service.transaction.Deposit({
                endpoint: chevre.credentials.pecorino.endpoint,
                auth: pecorinoAuthClient
            });
            const transaction = await depositService.start(req.body);

            // tslint:disable-next-line:no-string-literal
            // const host = req.headers['host'];
            // res.setHeader('Location', `https://${host}/transactions/${transaction.id}`);
            res.json(transaction);
        } catch (error) {
            next(error);
        }
    }
);

depositTransactionsRouter.put(
    '/:transactionId/confirm',
    permitScopes([]),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            const depositService = new chevre.pecorinoapi.service.transaction.Deposit({
                endpoint: chevre.credentials.pecorino.endpoint,
                auth: pecorinoAuthClient
            });
            await depositService.confirm({
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

depositTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes([]),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            const depositService = new chevre.pecorinoapi.service.transaction.Deposit({
                endpoint: chevre.credentials.pecorino.endpoint,
                auth: pecorinoAuthClient
            });
            await depositService.cancel({
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default depositTransactionsRouter;
