/**
 * サービスアウトプット識別子ルーター
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

const serviceOutputIdentifiersRouter = Router();

serviceOutputIdentifiersRouter.use(authentication);

/**
 * サービスアウトプット識別子発行
 */
serviceOutputIdentifiersRouter.post(
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
            const identifierRepo = new chevre.repository.ServiceOutputIdentifier(redis.getClient());

            const identifier = await identifierRepo.publishByTimestamp({
                project: { id: req.body.project.id },
                startDate: new Date()
            });

            res.status(CREATED)
                .json({ identifier });
        } catch (error) {
            next(error);
        }
    }
);

export default serviceOutputIdentifiersRouter;
