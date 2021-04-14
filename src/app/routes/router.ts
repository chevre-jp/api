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
import categoryCodesRouter from './categoryCode';
import creativeWorksRouter from './creativeWorks';
import eventsRouter from './events';
import healthRouter from './health';
import offerCatalogsRouter from './offerCatalogs';
import offersRouter from './offers';
import ordersRouter from './orders';
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

router.use('/accountingReports', accountingReportsRouter);
router.use('/accountTitles', accountTitlesRouter);
router.use('/actions', actionsRouter);
router.use('/aggregateSales', aggregateSalesRouter);
router.use('/categoryCodes', categoryCodesRouter);
router.use('/creativeWorks', creativeWorksRouter);
router.use('/places', placesRouter);
router.use('/events', eventsRouter);
router.use('/offers', offersRouter);
router.use('/orders', ordersRouter);
router.use('/offerCatalogs', offerCatalogsRouter);
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
