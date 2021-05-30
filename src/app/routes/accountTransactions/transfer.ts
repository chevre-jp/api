/**
 * 転送取引ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { NO_CONTENT } from 'http-status';

const transferTransactionsRouter = Router();

import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

const pecorinoAuthClient = new chevre.pecorinoapi.auth.ClientCredentials({
    domain: chevre.credentials.pecorino.authorizeServerDomain,
    clientId: chevre.credentials.pecorino.clientId,
    clientSecret: chevre.credentials.pecorino.clientSecret,
    scopes: [],
    state: ''
});

transferTransactionsRouter.post(
    '/start',
    permitScopes([]),
    ...[
    ],
    validator,
    async (req, res, next) => {
        try {
            const transferService = new chevre.pecorinoapi.service.transaction.Transfer({
                endpoint: chevre.credentials.pecorino.endpoint,
                auth: pecorinoAuthClient
            });
            const transaction = await transferService.start(req.body);

            // tslint:disable-next-line:no-string-literal
            // const host = req.headers['host'];
            // res.setHeader('Location', `https://${host}/transactions/${transaction.id}`);
            res.json(transaction);
        } catch (error) {
            next(error);
        }
    }
);

transferTransactionsRouter.put(
    '/:transactionId/confirm',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            const transferService = new chevre.pecorinoapi.service.transaction.Transfer({
                endpoint: chevre.credentials.pecorino.endpoint,
                auth: pecorinoAuthClient
            });
            await transferService.confirm({
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

transferTransactionsRouter.put(
    '/:transactionId/cancel',
    permitScopes(['admin']),
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberSpecified = String(req.query.transactionNumber) === '1';

            const transferService = new chevre.pecorinoapi.service.transaction.Transfer({
                endpoint: chevre.credentials.pecorino.endpoint,
                auth: pecorinoAuthClient
            });
            await transferService.cancel({
                ...(transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }
            });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default transferTransactionsRouter;
