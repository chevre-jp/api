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
 * 通貨転送取引ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const moment = require("moment");
const mongoose = require("mongoose");
const moneyTransferTransactionsRouter = express_1.Router();
const redis = require("../../../redis");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
moneyTransferTransactionsRouter.post('/start', permitScopes_1.default(['assetTransactions.write']), ...[
    express_validator_1.body('project')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('expires')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
        .isISO8601()
        .toDate(),
    express_validator_1.body('agent.typeOf')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('agent.name')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('recipient.typeOf')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required'),
    express_validator_1.body('recipient.name')
        .not()
        .isEmpty()
        .withMessage((_, __) => 'Required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountRepo = new chevre.repository.Account(mongoose.connection);
        const productRepo = new chevre.repository.Product(mongoose.connection);
        const serviceOutputRepo = new chevre.repository.ServiceOutput(mongoose.connection);
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
        const transactionNumberRepo = new chevre.repository.TransactionNumber(redis.getClient());
        const project = { id: req.project.id, typeOf: chevre.factory.organizationType.Project };
        const transaction = yield chevre.service.transaction.moneyTransfer.start(Object.assign(Object.assign({ typeOf: chevre.factory.assetTransactionType.MoneyTransfer, project: project, agent: req.body.agent, object: req.body.object, recipient: req.body.recipient, expires: moment(req.body.expires)
                .toDate() }, (typeof req.body.identifier === 'string') ? { identifier: req.body.identifier } : undefined), (typeof req.body.transactionNumber === 'string') ? { transactionNumber: req.body.transactionNumber } : undefined))({
            account: accountRepo,
            product: productRepo,
            project: projectRepo,
            serviceOutput: serviceOutputRepo,
            transaction: transactionRepo,
            transactionNumber: transactionNumberRepo
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
moneyTransferTransactionsRouter.put('/:transactionId/confirm', permitScopes_1.default(['assetTransactions.write']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
        yield chevre.service.transaction.moneyTransfer.confirm(Object.assign(Object.assign({}, req.body), (transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }))({ transaction: transactionRepo });
        // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
        // tslint:disable-next-line:no-floating-promises
        chevre.service.transaction.exportTasks({
            status: chevre.factory.transactionStatusType.Confirmed,
            typeOf: { $in: [chevre.factory.assetTransactionType.MoneyTransfer] }
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
moneyTransferTransactionsRouter.put('/:transactionId/cancel', permitScopes_1.default(['assetTransactions.write']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionNumberSpecified = String(req.query.transactionNumber) === '1';
        const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
        yield chevre.service.transaction.moneyTransfer.cancel(Object.assign(Object.assign({}, req.body), (transactionNumberSpecified) ? { transactionNumber: req.params.transactionId } : { id: req.params.transactionId }))({
            transaction: transactionRepo
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = moneyTransferTransactionsRouter;
