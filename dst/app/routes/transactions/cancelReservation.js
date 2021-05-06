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
 * 予約キャンセル取引ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const moment = require("moment");
const mongoose = require("mongoose");
const cancelReservationTransactionsRouter = express_1.Router();
const redis = require("../../../redis");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
cancelReservationTransactionsRouter.post('/start', permitScopes_1.default(['transactions']), ...[
    express_validator_1.body('project')
        .not()
        .isEmpty()
        .withMessage('required'),
    express_validator_1.body('expires')
        .not()
        .isEmpty()
        .withMessage('required')
        .isISO8601(),
    express_validator_1.body('agent')
        .not()
        .isEmpty()
        .withMessage('required'),
    express_validator_1.body('agent.typeOf')
        .not()
        .isEmpty()
        .withMessage('required'),
    express_validator_1.body('agent.name')
        .not()
        .isEmpty()
        .withMessage('required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
        const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
        const project = Object.assign(Object.assign({}, req.body.project), { typeOf: chevre.factory.organizationType.Project });
        const transaction = yield chevre.service.transaction.cancelReservation.start(Object.assign({ project: project, typeOf: chevre.factory.assetTransactionType.CancelReservation, agent: Object.assign({}, req.body.agent
            // id: (req.body.agent.id !== undefined) ? req.body.agent.id : req.user.sub,
            ), object: Object.assign({ clientUser: req.user }, req.body.object), expires: moment(req.body.expires)
                .toDate() }, (typeof req.body.transactionNumber === 'string') ? { transactionNumber: req.body.transactionNumber } : undefined))({
            project: projectRepo,
            reservation: reservationRepo,
            transaction: transactionRepo
        });
        res.json(transaction);
    }
    catch (error) {
        next(error);
    }
}));
cancelReservationTransactionsRouter.post('/confirm', permitScopes_1.default(['transactions']), ...[
    express_validator_1.body('project')
        .not()
        .isEmpty()
        .withMessage('required'),
    express_validator_1.body('expires')
        .not()
        .isEmpty()
        .withMessage('required')
        .isISO8601(),
    express_validator_1.body('agent')
        .not()
        .isEmpty()
        .withMessage('required'),
    express_validator_1.body('agent.typeOf')
        .not()
        .isEmpty()
        .withMessage('required'),
    express_validator_1.body('agent.name')
        .not()
        .isEmpty()
        .withMessage('required')
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
        const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
        const project = Object.assign(Object.assign({}, req.body.project), { typeOf: chevre.factory.organizationType.Project });
        yield chevre.service.transaction.cancelReservation.startAndConfirm(Object.assign({ project: project, typeOf: chevre.factory.assetTransactionType.CancelReservation, agent: Object.assign({}, req.body.agent
            // id: (req.body.agent.id !== undefined) ? req.body.agent.id : req.user.sub,
            ), object: Object.assign({ clientUser: req.user }, req.body.object), expires: moment(req.body.expires)
                .toDate(), potentialActions: Object.assign({}, req.body.potentialActions) }, (typeof req.body.transactionNumber === 'string') ? { transactionNumber: req.body.transactionNumber } : undefined))({
            project: projectRepo,
            reservation: reservationRepo,
            transaction: transactionRepo
        });
        // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
        // tslint:disable-next-line:no-floating-promises
        chevre.service.transaction.exportTasks({
            status: chevre.factory.transactionStatusType.Confirmed,
            typeOf: { $in: [chevre.factory.assetTransactionType.CancelReservation] }
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
cancelReservationTransactionsRouter.put('/:transactionId/confirm', permitScopes_1.default(['transactions']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
        yield chevre.service.transaction.cancelReservation.confirm(Object.assign(Object.assign({}, req.body), { id: req.params.transactionId }))({ transaction: transactionRepo });
        // 非同期でタスクエクスポート(APIレスポンスタイムに影響を与えないように)
        // tslint:disable-next-line:no-floating-promises
        chevre.service.transaction.exportTasks({
            status: chevre.factory.transactionStatusType.Confirmed,
            typeOf: { $in: [chevre.factory.assetTransactionType.CancelReservation] }
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
cancelReservationTransactionsRouter.put('/:transactionId/cancel', permitScopes_1.default(['transactions']), validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionRepo = new chevre.repository.AssetTransaction(mongoose.connection);
        yield transactionRepo.cancel({
            typeOf: chevre.factory.assetTransactionType.CancelReservation,
            id: req.params.transactionId
        });
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = cancelReservationTransactionsRouter;
