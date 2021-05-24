/**
 * 口座ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { body, query } from 'express-validator';
import { CREATED, NO_CONTENT } from 'http-status';
// import * as moment from 'moment';
import * as mongoose from 'mongoose';

import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const MAX_NUM_ACCOUNTS_CREATED = 100;

const pecorinoAuthClient = new chevre.pecorinoapi.auth.ClientCredentials({
    domain: chevre.credentials.pecorino.authorizeServerDomain,
    clientId: chevre.credentials.pecorino.clientId,
    clientSecret: chevre.credentials.pecorino.clientSecret,
    scopes: [],
    state: ''
});

const accountsRouter = Router();

/**
 * 口座同期
 */
// tslint:disable-next-line:use-default-type-parameter
// accountsRouter.put<ParamsDictionary>(
//     '/sync',
//     permitScopes([]),
//     ...[],
//     validator,
//     async (req, res, next) => {
//         try {
//             const accountRepo = new chevre.repository.Account(mongoose.connection);
//             const account = createAccount({
//                 ...req.body
//             });

//             await accountRepo.accountModel.findByIdAndUpdate(
//                 (<any>account).id,
//                 account,
//                 { upsert: true }
//             )
//                 .exec();

//             res.status(NO_CONTENT)
//                 .end();
//         } catch (error) {
//             next(error);
//         }
//     }
// );

// function createAccount(params: chevre.factory.account.IAccount): chevre.factory.account.IAccount {
//     delete (<any>params)._id;
//     delete (<any>params).createdAt;
//     delete (<any>params).updatedAt;

//     return {
//         ...params,
//         balance: Number(params.balance),
//         availableBalance: Number(params.availableBalance),
//         openDate: moment(params.openDate)
//             .toDate(),
//         ...(params.closeDate !== undefined && params.closeDate !== null)
//             ? {
//                 closeDate: moment(params.closeDate)
//                     .toDate()
//             }
//             : undefined
//     };
// }

/**
 * 口座解約
 * 冪等性の担保された処理となります。
 */
accountsRouter.put(
    '/:accountNumber/close',
    permitScopes([]),
    validator,
    async (req, res, next) => {
        try {
            const accountService = new chevre.pecorinoapi.service.Account({
                endpoint: chevre.credentials.pecorino.endpoint,
                auth: pecorinoAuthClient
            });
            await accountService.close({ accountNumber: req.params.accountNumber });

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 口座開設
 */
accountsRouter.post(
    '',
    permitScopes([]),
    ...[
        body()
            .isArray({ max: MAX_NUM_ACCOUNTS_CREATED })
            .withMessage(() => `must be array <= ${MAX_NUM_ACCOUNTS_CREATED}`)
    ],
    // ...validations,
    validator,
    async (req, res, next) => {
        try {
            const accountService = new chevre.pecorinoapi.service.Account({
                endpoint: chevre.credentials.pecorino.endpoint,
                auth: pecorinoAuthClient
            });
            const accounts = await accountService.open((<any[]>req.body).map((b) => {
                return {
                    ...b,
                    project: { id: req.project.id, typeOf: chevre.factory.organizationType.Project }
                };
            }));

            res.status(CREATED)
                .json(accounts);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 口座検索
 */
accountsRouter.get(
    '',
    permitScopes([]),
    ...[
        query('openDate.$gte')
            .optional()
            .isISO8601()
            .toDate(),
        query('openDate.$lte')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const accountRepo = new chevre.repository.Account(mongoose.connection);
            const searchConditions: chevre.factory.account.ISearchConditions = {
                ...req.query,
                project: { id: { $eq: req.project.id } },
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };
            const accounts = await accountRepo.search(searchConditions);

            res.json(accounts);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 口座アクション検索(口座番号指定)
 */
// tslint:disable-next-line:use-default-type-parameter
accountsRouter.get<ParamsDictionary>(
    '/:accountNumber/actions/moneyTransfer',
    permitScopes([]),
    ...[
        query('startDate.$gte')
            .optional()
            .isISO8601()
            .toDate(),
        query('startDate.$lte')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const actionRepo = new chevre.repository.AccountAction(mongoose.connection);
            const searchConditions: chevre.factory.account.action.moneyTransfer.ISearchConditions
                = {
                ...req.query,
                project: { id: { $eq: req.project.id } },
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1,
                accountNumber: req.params.accountNumber
            };
            let actions = await actionRepo.searchTransferActions(searchConditions);

            // 互換性維持対応
            actions = actions.map((a) => {
                return {
                    ...a,
                    amount: (typeof a.amount === 'number')
                        ? {
                            typeOf: 'MonetaryAmount',
                            currency: 'Point', // 旧データはPointしかないのでこれで十分
                            value: a.amount
                        }
                        : a.amount
                };
            });

            res.json(actions);
        } catch (error) {
            next(error);
        }
    }
);

export default accountsRouter;
