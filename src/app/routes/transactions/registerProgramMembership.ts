/**
 * メンバーシップ登録取引ルーター
 */
import * as chevre from '@chevre/domain';
import { Router } from 'express';
// import { NO_CONTENT } from 'http-status';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

const registerProgramMembershipTransactionsRouter = Router();

import authentication from '../../middlewares/authentication';
import permitScopes from '../../middlewares/permitScopes';
import validator from '../../middlewares/validator';

registerProgramMembershipTransactionsRouter.use(authentication);

registerProgramMembershipTransactionsRouter.post(
    '/start',
    permitScopes(['admin']),
    (req, _, next) => {
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
    },
    validator,
    async (req, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const productRepo = new chevre.repository.Product(mongoose.connection);
            const programMembershipRepo = new chevre.repository.ProgramMembership(mongoose.connection);
            const projectRepo = new chevre.repository.Project(mongoose.connection);
            const transactionRepo = new chevre.repository.Transaction(mongoose.connection);

            const project: chevre.factory.project.IProject = { ...req.body.project, typeOf: 'Project' };

            const transaction = await chevre.service.transaction.registerProgramMembership.start({
                project: project,
                typeOf: chevre.factory.transactionType.RegisterProgramMembership,
                agent: {
                    ...req.body.agent
                    // id: (req.body.agent.id !== undefined) ? req.body.agent.id : req.user.sub,
                },
                object: {
                    ...req.body.object
                },
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
        } catch (error) {
            next(error);
        }
    }
);

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

export default registerProgramMembershipTransactionsRouter;
