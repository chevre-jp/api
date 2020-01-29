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
 * メンバーシップ登録取引ルーター
 */
const chevre = require("@chevre/domain");
const express_1 = require("express");
// import { NO_CONTENT } from 'http-status';
const moment = require("moment");
const mongoose = require("mongoose");
const registerProgramMembershipTransactionsRouter = express_1.Router();
const authentication_1 = require("../../middlewares/authentication");
const permitScopes_1 = require("../../middlewares/permitScopes");
const validator_1 = require("../../middlewares/validator");
registerProgramMembershipTransactionsRouter.use(authentication_1.default);
registerProgramMembershipTransactionsRouter.post('/start', permitScopes_1.default(['admin']), (req, _, next) => {
    req.checkBody('project')
        .notEmpty()
        .withMessage('Required');
    req.checkBody('expires', 'invalid expires')
        .notEmpty()
        .withMessage('Required')
        .isISO8601();
    req.checkBody('agent', 'invalid agent')
        .notEmpty()
        .withMessage('Required');
    req.checkBody('agent.typeOf', 'invalid agent.typeOf')
        .notEmpty()
        .withMessage('Required');
    req.checkBody('agent.name', 'invalid agent.name')
        .notEmpty()
        .withMessage('Required');
    next();
}, validator_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offerRepo = new chevre.repository.Offer(mongoose.connection);
        const productRepo = new chevre.repository.Product(mongoose.connection);
        const programMembershipRepo = new chevre.repository.ProgramMembership(mongoose.connection);
        const projectRepo = new chevre.repository.Project(mongoose.connection);
        const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
        const project = Object.assign(Object.assign({}, req.body.project), { typeOf: 'Project' });
        const transaction = yield chevre.service.transaction.registerProgramMembership.start({
            project: project,
            typeOf: chevre.factory.transactionType.RegisterProgramMembership,
            agent: Object.assign({}, req.body.agent
            // id: (req.body.agent.id !== undefined) ? req.body.agent.id : req.user.sub,
            ),
            object: Object.assign({}, req.body.object),
            expires: moment(req.body.expires)
                .toDate()
        })({
            offer: offerRepo,
            product: productRepo,
            programMembership: programMembershipRepo,
            project: projectRepo,
            transaction: transactionRepo
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
// registerProgramMembershipTransactionsRouter.put(
//     '/:transactionId/confirm',
//     permitScopes(['admin', 'transactions']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
//             await chevre.service.transaction.registerProgramMembership.confirm({
//                 ...req.body,
//                 id: req.params.transactionId
//             })({ transaction: transactionRepo });
//             res.status(NO_CONTENT)
//                 .end();
//         } catch (error) {
//             next(error);
//         }
//     }
// );
// registerProgramMembershipTransactionsRouter.put(
//     '/:transactionId/cancel',
//     permitScopes(['admin', 'transactions']),
//     validator,
//     async (req, res, next) => {
//         try {
//             const actionRepo = new chevre.repository.Action(mongoose.connection);
//             const eventAvailabilityRepo = new chevre.repository.itemAvailability.ScreeningEvent(redis.getClient());
//             const reservationRepo = new chevre.repository.Reservation(mongoose.connection);
//             const taskRepo = new chevre.repository.Task(mongoose.connection);
//             const transactionRepo = new chevre.repository.Transaction(mongoose.connection);
//             await chevre.service.transaction.registerProgramMembership.cancel({
//                 id: req.params.transactionId
//             })({
//                 action: actionRepo,
//                 eventAvailability: eventAvailabilityRepo,
//                 reservation: reservationRepo,
//                 task: taskRepo,
//                 transaction: transactionRepo
//             });
//             res.status(NO_CONTENT)
//                 .end();
//         } catch (error) {
//             next(error);
//         }
//     }
// );
exports.default = registerProgramMembershipTransactionsRouter;
