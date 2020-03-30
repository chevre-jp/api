/**
 * ルーター
 */
import * as express from 'express';

import accountTitlesRouter from './accountTitles';
import categoryCodesRouter from './categoryCode';
import creativeWorksRouter from './creativeWorks';
import eventsRouter from './events';
import healthRouter from './health';
import offerCatalogsRouter from './offerCatalogs';
import offersRouter from './offers';
import placesRouter from './places';
import priceSpecificationsRouter from './priceSpecifications';
import productsRouter from './products';
import reservationsRouter from './reservations';
import statsRouter from './stats';
import tasksRouter from './tasks';
import transactionsRouter from './transactions';
const router = express.Router();

// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })

router.use('/health', healthRouter);
router.use('/accountTitles', accountTitlesRouter);
router.use('/categoryCodes', categoryCodesRouter);
router.use('/creativeWorks', creativeWorksRouter);
router.use('/places', placesRouter);
router.use('/events', eventsRouter);
router.use('/offers', offersRouter);
router.use('/offerCatalogs', offerCatalogsRouter);
router.use('/priceSpecifications', priceSpecificationsRouter);
router.use('/products', productsRouter);
router.use('/reservations', reservationsRouter);
router.use('/stats', statsRouter);
router.use('/tasks', tasksRouter);
router.use('/transactions', transactionsRouter);

export default router;
