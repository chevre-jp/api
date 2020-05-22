/**
 * 取引番号ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-submodule-imports
import { body } from 'express-validator/check';
import { CREATED } from 'http-status';

import * as redis from '../../redis';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const transactionNumbersRouter = Router();

transactionNumbersRouter.use(authentication);

/**
 * 取引番号発行
 */
transactionNumbersRouter.post(
    '',
    permitScopes(['admin']),
    ...[
        body('project.id')
            .not()
            .isEmpty()
            .withMessage(() => 'Required')
    ],
    validator,
    async (req, res, next) => {
        try {
            const transactionNumberRepo = new chevre.repository.TransactionNumber(redis.getClient());

            const transactionNumber = await transactionNumberRepo.publishByTimestamp({
                project: { id: req.body.project.id },
                startDate: new Date()
            });

            res.status(CREATED)
                .json({ transactionNumber });
        } catch (error) {
            next(error);
        }
    }
);

export default transactionNumbersRouter;
