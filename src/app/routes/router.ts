/**
 * ルーター
 */
import * as express from 'express';

import cronRouter from './cron';
import ahRouter from './_ah';

import accountingReportsRouter from './accountingReports';
import accountTitlesRouter from './accountTitles';
import actionsRouter from './actions';
import aggregateSalesRouter from './aggregateSales';
import authorizationsRouter from './authorizations';
import categoryCodesRouter from './categoryCode';
import creativeWorksRouter from './creativeWorks';
import customersRouter from './customer';
import eventsRouter from './events';
import healthRouter from './health';
import offerCatalogsRouter from './offerCatalogs';
import offersRouter from './offers';
import ordersRouter from './orders';
import ownershipInfosRouter from './ownershipInfos';
import placesRouter from './places';
import priceSpecificationsRouter from './priceSpecifications';
import productsRouter from './products';
import projectsRouter from './projects';
import reservationsRouter from './reservations';
import sellersRouter from './sellers';
import serviceOutputsRouter from './serviceOutputs';
import statsRouter from './stats';
import tasksRouter from './tasks';
import transactionNumbersRouter from './transactionNumbers';
import transactionsRouter from './transactions';
import webhooksRouter from './webhooks';

import authentication from '../middlewares/authentication';

const router = express.Router();

// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })

router.use('/_ah', ahRouter);
router.use('/cron', cronRouter);
router.use('/health', healthRouter);
router.use('/webhooks', webhooksRouter);

// 認証
router.use(authentication);

router.use('/accountingReports', accountingReportsRouter);
router.use('/accountTitles', accountTitlesRouter);
router.use('/actions', actionsRouter);
router.use('/aggregateSales', aggregateSalesRouter);
router.use('/authorizations', authorizationsRouter);
router.use('/categoryCodes', categoryCodesRouter);
router.use('/creativeWorks', creativeWorksRouter);
router.use('/customers', customersRouter);
router.use('/places', placesRouter);
router.use('/events', eventsRouter);
router.use('/offers', offersRouter);
router.use('/offerCatalogs', offerCatalogsRouter);
router.use('/orders', ordersRouter);
router.use('/ownershipInfos', ownershipInfosRouter);
router.use('/priceSpecifications', priceSpecificationsRouter);
router.use('/products', productsRouter);
router.use('/projects', projectsRouter);
router.use('/reservations', reservationsRouter);
router.use('/sellers', sellersRouter);
router.use('/serviceOutputs', serviceOutputsRouter);
router.use('/stats', statsRouter);
router.use('/tasks', tasksRouter);
router.use('/transactions', transactionsRouter);
router.use('/transactionNumbers', transactionNumbersRouter);

export default router;
