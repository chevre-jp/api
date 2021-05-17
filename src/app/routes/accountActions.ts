/**
 * 口座アクションルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const accountActionsRouter = Router();

/**
 * 口座アクション同期
 */
// tslint:disable-next-line:use-default-type-parameter
accountActionsRouter.put<ParamsDictionary>(
    '/sync',
    permitScopes([]),
    ...[],
    validator,
    async (req, res, next) => {
        try {
            const accountActionRepo = new chevre.repository.AccountAction(mongoose.connection);
            const action = createAccountAction({
                ...req.body
            });

            await accountActionRepo.actionModel.findByIdAndUpdate(
                action.id,
                {
                    $setOnInsert: action
                },
                { upsert: true }
            )
                .exec();

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

function createAccountAction(
    params: chevre.factory.account.action.moneyTransfer.IAction
): chevre.factory.account.action.moneyTransfer.IAction {
    delete (<any>params)._id;
    delete (<any>params).createdAt;
    delete (<any>params).updatedAt;

    return {
        ...params
    };
}

export default accountActionsRouter;
