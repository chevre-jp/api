/**
 * 口座アクションルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
// import { ParamsDictionary } from 'express-serve-static-core';
import { query } from 'express-validator';
// import { NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const accountActionsRouter = Router();

/**
 * 口座アクション同期
 */
// tslint:disable-next-line:use-default-type-parameter
// accountActionsRouter.put<ParamsDictionary>(
//     '/sync',
//     permitScopes([]),
//     ...[],
//     validator,
//     async (req, res, next) => {
//         try {
//             const accountActionRepo = new chevre.repository.AccountAction(mongoose.connection);
//             const action = createAccountAction({
//                 ...req.body
//             });

//             await accountActionRepo.actionModel.findByIdAndUpdate(
//                 action.id,
//                 {
//                     $setOnInsert: action
//                 },
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

// function createAccountAction(
//     params: chevre.factory.account.action.moneyTransfer.IAction
// ): chevre.factory.account.action.moneyTransfer.IAction {
//     delete (<any>params)._id;
//     delete (<any>params).createdAt;
//     delete (<any>params).updatedAt;

//     return {
//         ...params
//     };
// }

/**
 * 口座アクション検索
 */
accountActionsRouter.get(
    '',
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
            const searchConditions: chevre.factory.account.action.moneyTransfer.ISearchConditions = {
                ...req.query,
                project: { id: { $eq: req.project.id } },
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            const accountActionRepo = new chevre.repository.AccountAction(mongoose.connection);
            const actions = await accountActionRepo.searchTransferActions(searchConditions);

            // 互換性維持対応
            // actions = actions.map((a) => {
            //     return {
            //         ...a,
            //         amount: (typeof a.amount === 'number')
            //             ? {
            //                 typeOf: 'MonetaryAmount',
            //                 currency: 'Point', // 旧データはPointしかないのでこれで十分
            //                 value: a.amount
            //             }
            //             : a.amount
            //     };
            // });

            res.json(actions);
        } catch (error) {
            next(error);
        }
    }
);

export default accountActionsRouter;
