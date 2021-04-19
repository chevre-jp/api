/**
 * 所有権ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// tslint:disable-next-line:no-implicit-dependencies
// import { ParamsDictionary } from 'express-serve-static-core';
import { body, query } from 'express-validator';
import { CREATED } from 'http-status';
import * as mongoose from 'mongoose';

import authentication from '../middlewares/authentication';
import permitScopes from '../middlewares/permitScopes';
import validator from '../middlewares/validator';

const ownershipInfosRouter = Router();
ownershipInfosRouter.use(authentication);

/**
 * 所有権作成
 * 識別子に対して冪等性を確保
 */
ownershipInfosRouter.post(
    '/saveByIdentifier',
    permitScopes(['admin']),
    ...[
        body('project.id')
            .not()
            .isEmpty()
            .isString(),
        body('identifier')
            .not()
            .isEmpty()
            .isString(),
        body('ownedBy')
            .not()
            .isEmpty(),
        body('ownedFrom')
            .not()
            .isEmpty()
            .isISO8601()
            .toDate(),
        body('ownedThrough')
            .optional()
            .isISO8601()
            .toDate(),
        body('typeOfGood')
            .not()
            .isEmpty()
    ],
    validator,
    async (req, res, next) => {
        try {
            const ownershipInfoRepo = new chevre.repository.OwnershipInfo(mongoose.connection);

            const ownershipInfo = await ownershipInfoRepo.saveByIdentifier({
                id: '',
                identifier: req.body.identifier,
                ownedBy: req.body.ownedBy,
                ownedFrom: req.body.ownedFrom,
                project: { typeOf: chevre.factory.organizationType.Project, id: req.body.project?.id },
                typeOf: 'OwnershipInfo',
                typeOfGood: req.body.typeOfGood,
                ...(req.body.ownedThrough instanceof Date) ? { ownedThrough: req.body.ownedThrough } : undefined,
                ...(req.body.acquiredFrom !== undefined && req.body.acquiredFrom !== null)
                    ? { acquiredFrom: req.body.acquiredFrom }
                    : undefined
            });

            res.status(CREATED)
                .json(ownershipInfo);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 所有権検索
 */
ownershipInfosRouter.get(
    '',
    permitScopes(['admin']),
    ...[
        query('project.id.$eq')
            .not()
            .isEmpty()
            .isString(),
        query('ownedFrom')
            .optional()
            .isISO8601()
            .toDate(),
        query('ownedThrough')
            .optional()
            .isISO8601()
            .toDate()
    ],
    validator,
    async (req, res, next) => {
        try {
            const ownershipInfoRepo = new chevre.repository.OwnershipInfo(mongoose.connection);

            const typeOfGood = (req.query.typeOfGood !== undefined && req.query.typeOfGood !== null) ? req.query.typeOfGood : {};
            let ownershipInfos: chevre.factory.ownershipInfo.IOwnershipInfo<chevre.factory.ownershipInfo.IGoodWithDetail>[]
                | chevre.factory.ownershipInfo.IOwnershipInfo<chevre.factory.ownershipInfo.IGood>[];

            const searchConditions: chevre.factory.ownershipInfo.ISearchConditions = {
                ...req.query,
                project: { id: { $eq: String(req.query?.project?.id?.$eq) } },
                // tslint:disable-next-line:no-magic-numbers
                limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100,
                page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1
            };

            switch (typeOfGood.typeOf) {
                default:
                    ownershipInfos = await ownershipInfoRepo.search(searchConditions);
            }

            res.json(ownershipInfos);
        } catch (error) {
            next(error);
        }
    }
);

export default ownershipInfosRouter;
