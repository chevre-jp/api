/**
 * 口座ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
import { ParamsDictionary } from 'express-serve-static-core';
import { NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const accountsRouter = Router();

/**
 * 口座同期
 */
// tslint:disable-next-line:use-default-type-parameter
accountsRouter.put<ParamsDictionary>(
    '/sync',
    permitScopes([]),
    ...[],
    validator,
    async (req, res, next) => {
        try {
            const accountRepo = new chevre.repository.Account(mongoose.connection);
            const account = createAccount({
                ...req.body
            });

            await accountRepo.accountModel.findByIdAndUpdate(
                (<any>account).id,
                account,
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

function createAccount(params: chevre.factory.account.IAccount): chevre.factory.account.IAccount {
    delete (<any>params)._id;
    delete (<any>params).createdAt;
    delete (<any>params).updatedAt;

    return {
        ...params,
        balance: Number(params.balance),
        availableBalance: Number(params.availableBalance),
        openDate: moment(params.openDate)
            .toDate(),
        ...(params.closeDate !== undefined && params.closeDate !== null)
            ? {
                closeDate: moment(params.closeDate)
                    .toDate()
            }
            : undefined
    };
}

export default accountsRouter;
