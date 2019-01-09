"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 勘定科目ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const http_status_1 = require("http-status");
const authentication_1 = require("../middlewares/authentication");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const accountTitlesRouter = express_1.Router();
accountTitlesRouter.use(authentication_1.default);
/**
 * 科目分類追加
 */
accountTitlesRouter.post('/accountTitleCategory', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountTitle = req.body;
        const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
        yield accountTitleRepo.save(accountTitle);
        res.status(http_status_1.CREATED).json(accountTitle);
    }
    catch (error) {
        next(error);
    }
}));
// accountTitlesRouter.get(
//     '/:codeValue',
//     permitScopes(['admin', 'accountTitles', 'accountTitles.read-only']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
//             const accountTitle = await accountTitleRepo.find({ codeValue: req.params.codeValue });
//             res.json(accountTitle);
//         } catch (error) {
//             next(error);
//         }
//     }
// );
// accountTitlesRouter.put(
//     '/:identifier',
//     permitScopes(['admin']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const accountTitle: chevre.factory.accountTitle.IAccountTitle = req.body;
//             const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
//             await accountTitleRepo.save(accountTitle);
//             res.status(NO_CONTENT).end();
//         } catch (error) {
//             next(error);
//         }
//     }
// );
// accountTitlesRouter.delete(
//     '/:identifier',
//     permitScopes(['admin']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
//             await accountTitleRepo.deleteByIdentifier({ identifier: req.params.identifier });
//             res.status(NO_CONTENT).end();
//         } catch (error) {
//             next(error);
//         }
//     }
// );
/**
 * 科目追加
 */
accountTitlesRouter.post('/accountTitleSet', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountTitle = {
            typeOf: req.body.typeOf,
            codeValue: req.body.codeValue,
            name: req.body.name,
            description: req.body.description
        };
        const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
        yield accountTitleRepo.accountTitleModel.findOneAndUpdate({ codeValue: req.params.codeValue }, {
            $push: { hasCategoryCode: accountTitle }
        }, { new: true }).exec();
        res.status(http_status_1.CREATED).json(accountTitle);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 細目追加
 */
accountTitlesRouter.post('', permitScopes_1.default(['admin']), validator_1.default, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountTitle = req.body;
        const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
        yield accountTitleRepo.accountTitleModel.findOneAndUpdate({
            codeValue: req.params.codeValue,
            'hasCategoryCode.codeValue': req.params.accountTitleSetCodeValue
        }, {
            $push: { 'hasCategoryCode.$.hasCategoryCode': accountTitle }
        }, { new: true }).exec();
        res.status(http_status_1.CREATED).json(accountTitle);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 細目検索
 */
accountTitlesRouter.get('', permitScopes_1.default(['admin', 'accountTitles', 'accountTitles.read-only']), validator_1.default, 
// tslint:disable-next-line:max-func-body-length
(req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
        const searchCoinditions = Object.assign({}, req.query, { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        // const totalCount = await accountTitleRepo.count(searchCoinditions);
        // const accountTitles = await accountTitleRepo.search(searchCoinditions);
        // res.set('X-Total-Count', totalCount.toString());
        // res.json(accountTitles);
        const matchStages = [];
        if (searchCoinditions.codeValue !== undefined) {
            matchStages.push({
                $match: {
                    'hasCategoryCode.hasCategoryCode.codeValue': {
                        $exists: true,
                        $regex: new RegExp(searchCoinditions.codeValue, 'i')
                    }
                }
            });
        }
        if (searchCoinditions.inCodeSet !== undefined) {
            if (searchCoinditions.inCodeSet.codeValue !== undefined) {
                matchStages.push({
                    $match: {
                        'hasCategoryCode.codeValue': {
                            $exists: true,
                            $regex: new RegExp(searchCoinditions.inCodeSet.codeValue, 'i')
                        }
                    }
                });
            }
            if (searchCoinditions.inCodeSet.inCodeSet !== undefined) {
                if (searchCoinditions.inCodeSet.inCodeSet.codeValue !== undefined) {
                    matchStages.push({
                        $match: {
                            codeValue: {
                                $exists: true,
                                $regex: new RegExp(searchCoinditions.inCodeSet.inCodeSet.codeValue, 'i')
                            }
                        }
                    });
                }
            }
        }
        const totalCountResult = yield accountTitleRepo.accountTitleModel.aggregate([
            { $unwind: '$hasCategoryCode' },
            { $unwind: '$hasCategoryCode.hasCategoryCode' },
            ...matchStages,
            { $count: 'totalCount' }
        ]).exec();
        const totalCount = (Array.isArray(totalCountResult) && totalCountResult.length > 0) ? totalCountResult[0].totalCount : 0;
        const aggregate = accountTitleRepo.accountTitleModel.aggregate([
            { $unwind: '$hasCategoryCode' },
            { $unwind: '$hasCategoryCode.hasCategoryCode' },
            ...matchStages,
            {
                $project: {
                    _id: 0,
                    codeValue: '$hasCategoryCode.hasCategoryCode.codeValue',
                    name: '$hasCategoryCode.hasCategoryCode.name',
                    inCodeSet: {
                        codeValue: '$hasCategoryCode.codeValue',
                        name: '$hasCategoryCode.name',
                        inCodeSet: {
                            codeValue: '$codeValue',
                            name: '$name'
                        }
                    }
                }
            }
        ]);
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (searchCoinditions.limit !== undefined && searchCoinditions.page !== undefined) {
            aggregate.limit(searchCoinditions.limit * searchCoinditions.page)
                .skip(searchCoinditions.limit * (searchCoinditions.page - 1));
        }
        const accountTitles = yield aggregate.exec();
        res.set('X-Total-Count', totalCount.toString());
        res.json(accountTitles);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 科目検索
 */
accountTitlesRouter.get('/accountTitleSet', permitScopes_1.default(['admin', 'accountTitles', 'accountTitles.read-only']), validator_1.default, 
// tslint:disable-next-line:max-func-body-length
(req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
        const searchCoinditions = Object.assign({}, req.query, { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        // const totalCount = await accountTitleRepo.count(searchCoinditions);
        // const accountTitles = await accountTitleRepo.search(searchCoinditions);
        // res.set('X-Total-Count', totalCount.toString());
        // res.json(accountTitles);
        const matchStages = [];
        if (searchCoinditions.codeValue !== undefined) {
            matchStages.push({
                $match: {
                    'hasCategoryCode.codeValue': {
                        $exists: true,
                        $regex: new RegExp(searchCoinditions.codeValue, 'i')
                    }
                }
            });
        }
        if (searchCoinditions.inCodeSet !== undefined) {
            if (searchCoinditions.inCodeSet.codeValue !== undefined) {
                matchStages.push({
                    $match: {
                        codeValue: {
                            $exists: true,
                            $regex: new RegExp(searchCoinditions.inCodeSet.codeValue, 'i')
                        }
                    }
                });
            }
        }
        const totalCountResult = yield accountTitleRepo.accountTitleModel.aggregate([
            { $unwind: '$hasCategoryCode' },
            ...matchStages,
            { $count: 'totalCount' }
        ]).exec();
        const totalCount = (Array.isArray(totalCountResult) && totalCountResult.length > 0) ? totalCountResult[0].totalCount : 0;
        const aggregate = accountTitleRepo.accountTitleModel.aggregate([
            { $unwind: '$hasCategoryCode' },
            ...matchStages,
            {
                $project: {
                    _id: 0,
                    codeValue: '$hasCategoryCode.codeValue',
                    name: '$hasCategoryCode.name',
                    inCodeSet: {
                        codeValue: '$codeValue',
                        name: '$name'
                    }
                }
            }
        ]);
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (searchCoinditions.limit !== undefined && searchCoinditions.page !== undefined) {
            aggregate.limit(searchCoinditions.limit * searchCoinditions.page)
                .skip(searchCoinditions.limit * (searchCoinditions.page - 1));
        }
        const accountTitles = yield aggregate.exec();
        res.set('X-Total-Count', totalCount.toString());
        res.json(accountTitles);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 科目分類検索
 */
accountTitlesRouter.get('/accountTitleCategory', permitScopes_1.default(['admin', 'accountTitles', 'accountTitles.read-only']), validator_1.default, 
// tslint:disable-next-line:max-func-body-length
(req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const accountTitleRepo = new chevre.repository.AccountTitle(chevre.mongoose.connection);
        const searchCoinditions = Object.assign({}, req.query, { 
            // tslint:disable-next-line:no-magic-numbers no-single-line-block-comment
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        // const totalCount = await accountTitleRepo.count(searchCoinditions);
        // const accountTitles = await accountTitleRepo.search(searchCoinditions);
        // res.set('X-Total-Count', totalCount.toString());
        // res.json(accountTitles);
        const conditions = [
            { typeOf: 'AccountTitle' }
        ];
        if (searchCoinditions.codeValue !== undefined) {
            conditions.push({
                codeValue: {
                    $exists: true,
                    $regex: new RegExp(searchCoinditions.codeValue, 'i')
                }
            });
        }
        const totalCount = yield accountTitleRepo.accountTitleModel.countDocuments({ $and: conditions }).setOptions({ maxTimeMS: 10000 })
            .exec();
        const query = accountTitleRepo.accountTitleModel.find({ $and: conditions }, {
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
            hasCategoryCode: 0
        });
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (searchCoinditions.limit !== undefined && searchCoinditions.page !== undefined) {
            query.limit(searchCoinditions.limit).skip(searchCoinditions.limit * (searchCoinditions.page - 1));
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (searchCoinditions.sort !== undefined) {
            query.sort(searchCoinditions.sort);
        }
        const accountTitles = yield query.setOptions({ maxTimeMS: 10000 }).exec().then((docs) => docs.map((doc) => doc.toObject()));
        res.set('X-Total-Count', totalCount.toString());
        res.json(accountTitles);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = accountTitlesRouter;
