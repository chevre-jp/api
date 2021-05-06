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
 * アクションルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const permitScopes_1 = require("../middlewares/permitScopes");
const validator_1 = require("../middlewares/validator");
const informUseReservationUrls = (typeof process.env.INFORM_USE_RESERVATION_URL === 'string')
    ? process.env.INFORM_USE_RESERVATION_URL.split(',')
    : [];
const actionsRouter = express_1.Router();
/**
 * アクション検索
 */
actionsRouter.get('', permitScopes_1.default(['admin']), ...[
    express_validator_1.query('limit')
        .optional()
        .isInt()
        .toInt(),
    express_validator_1.query('page')
        .optional()
        .isInt()
        .toInt(),
    express_validator_1.query('startFrom')
        .optional()
        .isISO8601()
        .toDate(),
    express_validator_1.query('startThrough')
        .optional()
        .isISO8601()
        .toDate()
], validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const actionRepo = new chevre.repository.Action(mongoose.connection);
        const searchConditions = Object.assign(Object.assign({}, req.query), { 
            // tslint:disable-next-line:no-magic-numbers
            limit: (req.query.limit !== undefined) ? Math.min(req.query.limit, 100) : 100, page: (req.query.page !== undefined) ? Math.max(req.query.page, 1) : 1 });
        const actions = yield actionRepo.search(searchConditions);
        res.json(actions);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * アクションを取消
 */
actionsRouter.put(`/:id/${chevre.factory.actionStatusType.CanceledActionStatus}`, permitScopes_1.default(['admin']), validator_1.default, 
// tslint:disable-next-line:max-func-body-length
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const actionRepo = new chevre.repository.Action(mongoose.connection);
        const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
        const taskRepo = new chevre.repository.Task(mongoose.connection);
        const doc = yield actionRepo.actionModel.findById(req.params.id)
            .exec();
        if (doc === null) {
            throw new chevre.factory.errors.NotFound('Action');
        }
        let action = doc.toObject();
        action = yield actionRepo.cancel({ typeOf: action.typeOf, id: action.id });
        // 予約使用アクションであれば、イベント再集計
        if (action.typeOf === chevre.factory.actionType.UseAction
            && Array.isArray(action.object)
            && typeof ((_b = (_a = action.object[0]) === null || _a === void 0 ? void 0 : _a.reservationFor) === null || _b === void 0 ? void 0 : _b.id) === 'string') {
            const reservation = action.object[0];
            try {
                // 予約使用アクションが存在しなければ、dateUsedをunset
                const useReservationActions = yield actionRepo.search({
                    limit: 1,
                    actionStatus: { $in: [chevre.factory.actionStatusType.CompletedActionStatus] },
                    typeOf: { $eq: chevre.factory.actionType.UseAction },
                    object: Object.assign({ 
                        // 予約タイプ
                        typeOf: { $eq: chevre.factory.reservationType.EventReservation } }, {
                        id: { $eq: reservation.id }
                    })
                });
                if (useReservationActions.length === 0) {
                    yield reservationRepo.reservationModel.findByIdAndUpdate(reservation.id, {
                        $unset: { 'reservedTicket.dateUsed': 1 }
                    })
                        .exec();
                }
            }
            catch (error) {
                console.error('unset reservedTicket.dateUsed failed.', error);
            }
            const tasks = [];
            // アクション通知タスク作成
            if (Array.isArray(informUseReservationUrls)) {
                informUseReservationUrls.filter((url) => url.length > 0)
                    .forEach((url) => {
                    const triggerWebhookTask = {
                        project: action.project,
                        name: chevre.factory.taskName.TriggerWebhook,
                        status: chevre.factory.taskStatus.Ready,
                        runsAt: new Date(),
                        remainingNumberOfTries: 3,
                        numberOfTried: 0,
                        executionResults: [],
                        data: {
                            project: action.project,
                            typeOf: chevre.factory.actionType.InformAction,
                            agent: action.project,
                            recipient: {
                                typeOf: chevre.factory.personType.Person,
                                id: url,
                                url
                            },
                            object: action
                        }
                    };
                    tasks.push(triggerWebhookTask);
                });
            }
            const aggregateTask = {
                project: action.project,
                name: chevre.factory.taskName.AggregateScreeningEvent,
                status: chevre.factory.taskStatus.Ready,
                runsAt: new Date(),
                remainingNumberOfTries: 3,
                numberOfTried: 0,
                executionResults: [],
                data: {
                    typeOf: action.object[0].reservationFor.typeOf,
                    id: action.object[0].reservationFor.id
                }
            };
            tasks.push(aggregateTask);
            if (tasks.length > 0) {
                yield taskRepo.saveMany(tasks);
            }
        }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = actionsRouter;
