/**
 * ルーター
 */
import * as express from 'express';

import accountTitlesRouter from './accountTitles';
import categoryCodesRouter from './categoryCode';
import creativeWorksRouter from './creativeWorks';
import distributorsRouter from './distributors';
import eventsRouter from './events';
import healthRouter from './health';
import offerCatalogsRouter from './offerCatalogs';
import offerCategoriesRouter from './offerCategories';
import offersRouter from './offers';
import placesRouter from './places';
import priceSpecificationsRouter from './priceSpecifications';
import productsRouter from './products';
import reservationsRouter from './reservations';
import serviceTypesRouter from './serviceTypes';
import statsRouter from './stats';
import subjectRouter from './subject';
import tasksRouter from './tasks';
import ticketTypeGroupsRouter from './ticketTypeGroups';
import ticketTypesRouter from './ticketTypes';
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
router.use('/distributions', distributorsRouter);
router.use('/places', placesRouter);
router.use('/events', eventsRouter);
router.use('/offers', offersRouter);
router.use('/offerCatalogs', offerCatalogsRouter);
router.use('/offerCategories', offerCategoriesRouter);
router.use('/priceSpecifications', priceSpecificationsRouter);
router.use('/products', productsRouter);
router.use('/reservations', reservationsRouter);
router.use('/serviceTypes', serviceTypesRouter);
router.use('/stats', statsRouter);
router.use('/subjects', subjectRouter);
router.use('/tasks', tasksRouter);
router.use('/ticketTypeGroups', ticketTypeGroupsRouter);
router.use('/ticketTypes', ticketTypesRouter);
router.use('/transactions', transactionsRouter);

export default router;
