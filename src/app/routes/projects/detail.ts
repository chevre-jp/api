/**
 * プロジェクト詳細ルーター
 */
import * as chevre from '@chevre/domain';
import * as express from 'express';

import accountActionsRouter from '../accountActions';
import accountingReportsRouter from '../accountingReports';
import accountsRouter from '../accounts';
import accountTitlesRouter from '../accountTitles';
import actionsRouter from '../actions';
import aggregateSalesRouter from '../aggregateSales';
import assetTransactionsRouter from '../assetTransactions';
import authorizationsRouter from '../authorizations';
import categoryCodesRouter from '../categoryCode';
import creativeWorksRouter from '../creativeWorks';
import customersRouter from '../customer';
import eventsRouter from '../events';
import healthRouter from '../health';
import iamRouter from '../iam';
import offerCatalogsRouter from '../offerCatalogs';
import offersRouter from '../offers';
import ordersRouter from '../orders';
import ownershipInfosRouter from '../ownershipInfos';
import placesRouter from '../places';
import priceSpecificationsRouter from '../priceSpecifications';
import productsRouter from '../products';
import reservationsRouter from '../reservations';
import sellersRouter from '../sellers';
import serviceOutputsRouter from '../serviceOutputs';
import statsRouter from '../stats';
import tasksRouter from '../tasks';
import transactionNumbersRouter from '../transactionNumbers';
import userPoolsRouter from '../userPools';

const projectDetailRouter = express.Router();

projectDetailRouter.use((req, _, next) => {
    // プロジェクト未指定は拒否
    if (typeof req.project?.id !== 'string') {
        next(new chevre.factory.errors.Forbidden('project not specified'));

        return;
    }

    next();
});

projectDetailRouter.use('/health', healthRouter);

projectDetailRouter.use('/accounts', accountsRouter);
projectDetailRouter.use('/accountActions', accountActionsRouter);
projectDetailRouter.use('/accountingReports', accountingReportsRouter);
projectDetailRouter.use('/accountTitles', accountTitlesRouter);
projectDetailRouter.use('/actions', actionsRouter);
projectDetailRouter.use('/aggregateSales', aggregateSalesRouter);
projectDetailRouter.use('/authorizations', authorizationsRouter);
projectDetailRouter.use('/categoryCodes', categoryCodesRouter);
projectDetailRouter.use('/creativeWorks', creativeWorksRouter);
projectDetailRouter.use('/customers', customersRouter);
projectDetailRouter.use('/places', placesRouter);
projectDetailRouter.use('/events', eventsRouter);
projectDetailRouter.use('/iam', iamRouter);
projectDetailRouter.use('/offers', offersRouter);
projectDetailRouter.use('/offerCatalogs', offerCatalogsRouter);
projectDetailRouter.use('/orders', ordersRouter);
projectDetailRouter.use('/ownershipInfos', ownershipInfosRouter);
projectDetailRouter.use('/priceSpecifications', priceSpecificationsRouter);
projectDetailRouter.use('/products', productsRouter);
projectDetailRouter.use('/reservations', reservationsRouter);
projectDetailRouter.use('/sellers', sellersRouter);
projectDetailRouter.use('/serviceOutputs', serviceOutputsRouter);
projectDetailRouter.use('/stats', statsRouter);
projectDetailRouter.use('/tasks', tasksRouter);
projectDetailRouter.use('/transactions', assetTransactionsRouter);
projectDetailRouter.use('/transactionNumbers', transactionNumbersRouter);
projectDetailRouter.use('/userPools', userPoolsRouter);

export default projectDetailRouter;
