/**
 * 取引番号ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
import { body } from 'express-validator';
import { CREATED } from 'http-status';

import * as redis from '../../redis';

import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const transactionNumbersRouter = Router();

/**
 * 取引番号発行
 */
transactionNumbersRouter.post(
    '',
    permitScopes(['transactionNumbers.write']),
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
