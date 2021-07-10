"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 決済取引ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const payTransactionsRouter = express_1.Router();
const redis = require("../../../redis");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
/**
 * 外部決済URL発行
 */
payTransactionsRouter.post('/publishPaymentUrl', permitScopes_1.default([]), ...[
    // body('project')
    //     .not()
    //     .isEmpty()
    //     .withMessage('Required'),
    // body('expires')
    //     .not()
    //     .isEmpty()
    //     .withMessage('Required')
    //     .isISO8601()
    //     .toDate(),
    express_validator_1.body('transactionNumber')
        .not()
        .isEmpty()
        .withMessage('Required')
        .isString()
    // body('agent')
    //     .not()
    //     .isEmpty()
    //     .withMessage('Required'),
    // body('agent.typeOf')
    //     .not()
    //     .isEmpty()
    //     .withMessage('Required'),
    // body('agent.name')
    //     .not()
    //     .isEmpty()
    //     .withMessage('Required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productRepo = new chevre.repository.Product(mongoose.connection);
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        const sellerRepo = new chevre.repository.Seller(mongoose.connection);
        const project = { id: req.project.id, typeOf: chevre.factory.organizationType.Project };
        const result = yield chevre.service.transaction.pay.publishPaymentUrl(Object.assign(Object.assign({ project: project, typeOf: chevre.factory.assetTransactionType.Pay, agent: Object.assign({}, req.body.agent), object: req.body.object, recipient: Object.assign({}, req.body.recipient), expires: req.body.expires }, (typeof req.body.transactionNumber === 'string') ? { transactionNumber: req.body.transactionNumber } : undefined), (req.body.purpose !== undefined && req.body.purpose !== null) ? { purpose: req.body.purpose } : undefined))({
            product: productRepo,
            project: projectRepo,
            seller: sellerRepo
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 決済認証(ムビチケ購入番号確認)
 */
payTransactionsRouter.post('/check', permitScopes_1.default([]), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = { id: req.project.id, typeOf: chevre.factory.organizationType.Project };
        const action = yield chevre.service.transaction.pay.check({
            project: project,
            typeOf: chevre.factory.actionType.CheckAction,
            agent: Object.assign({}, req.body.agent),
            object: req.body.object,
            recipient: Object.assign({}, req.body.recipient)
        })({
            action: new chevre.repository.Action(mongoose.connection),
            event: new chevre.repository.Event(mongoose.connection),
            product: new chevre.repository.Product(mongoose.connection),
            project: new chevre.repository.Project(mongoose.connection),
            seller: new chevre.repository.Seller(mongoose.connection)
        });
        res.status(http_status_1.CREATED)
            .json(action);
    }
    catch (error) {
        next(error);
    }
}));
payTransactionsRouter.post('/start', permitScopes_1.default([]), ...[
    express_validator_1.body('project')
        .not()
        .isEmpty()
        .withMessage('Required'),
    express_validator_1.body('expires')
        .not()
        .isEmpty()
        .withMessage('Required')
        .isISO8601()
        .toDate(),
    express_validator_1.body('transactionNumber')
        .not()
        .isEmpty()
        .withMessage('Required')
        .isString(),
    express_validator_1.body('agent')
        .not()
        .isEmpty()
        .withMessage('Required'),
    express_validator_1.body('agent.typeOf')
        .not()
        .isEmpty()
        .withMessage('Required'),
    express_validator_1.body('agent.name')
        .not()
        .isEmpty()
        .withMessage('Required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountRepo = new chevre.repository.Account(mongoose.connection);
        const actionRepo = new chevre.repository.Action(mongoose.connection);
        const eventRepo = new chevre.repository.Event(mongoose.connection);
        const productRepo = new chevre.repository.Product(mongoose.connection);
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        const sellerRepo = new chevre.repository.Seller(mongoose.connection);
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
        const project = { id: req.project.id, typeOf: chevre.factory.organizationType.Project };
        const transaction = yield chevre.service.transaction.pay.start(Object.assign(Object.assign({ project: project, typeOf: chevre.factory.assetTransactionType.Pay, agent: Object.assign({}, req.body.agent), object: req.body.object, recipient: Object.assign({}, req.body.recipient), expires: req.body.expires }, (typeof req.body.transactionNumber === 'string') ? { transactionNumber: req.body.transactionNumber } : undefined), (req.body.purpose !== undefined && req.body.purpose !== null) ? { purpose: req.body.purpose } : undefined))({
            account: accountRepo,
            action: actionRepo,
            event: eventRepo,
            product: productRepo,
            project: projectRepo,
            seller: sellerRepo,
            transaction: transactionRepo,
            task: taskRepo
        });
        res.json(transaction);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * 取引確定
 */
// tslint:disable-next-line:use-default-type-parameter
payTransactionsRouter.put('/:transactionId/confirm', permitScopes_1.default([]), ...[
    express_validator_1.body('endDate')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
        yield chevre.service.transaction.pay.confirm(Object.assign(Object.assign({}, req.body), (transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }))({ transaction: transactionRepo });
        // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
        // tslint:disable-next-line:no-floating-promises
        chevre.service.transaction.exportTasks({
            status: chevre.factory.transactionStatusType.Confirmed,
            typeOf: { $in: [chevre.factory.assetTransactionType.Pay] }
        })({
            project: projectRepo,
            task: taskRepo,
            transaction: transactionRepo
        })
            .then((tasks) => __awaiter(void 0, void 0, void 0, function* () {
            // タスクがあればすべて実行
            if (Array.isArray(tasks)) {
                yield Promise.all(tasks.map((task) => __awaiter(void 0, void 0, void 0, function* () {
                    yield chevre.service.task.executeByName({ name: task.name })({
                        connection: mongoose.connection,
                        redisClient: redis.getClient()
                    });
                })));
            }
        }));
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
payTransactionsRouter.put('/:transactionId/cancel', permitScopes_1.default([]), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
        yield chevre.service.transaction.pay.cancel(Object.assign(Object.assign({}, req.body), (transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }))({
            transaction: transactionRepo
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = payTransactionsRouter;
