/**
 * ルーター
 */
import * as express from 'express';

import accountTitlesRouter from './accountTitles';
import boxOfficeTypesRouter from './boxOfficeTypes';
import creativeWorksRouter from './creativeWorks';
import distributorsRouter from './distributors';
import eventsRouter from './events';
import healthRouter from './health';
import offerCatalogsRouter from './offerCatalogs';
import offersRouter from './offers';
import placesRouter from './places';
import priceSpecificationsRouter from './priceSpecifications';
import productOffersRouter from './productOffer';
import reservationsRouter from './reservations';
import serviceTypesRouter from './serviceTypes';
import subjectRouter from './subject';
import transactionsRouter from './transactions';
const router = express.Router();

// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })

router.use('/health', healthRouter);
router.use('/accountTitles', accountTitlesRouter);
router.use('/creativeWorks', creativeWorksRouter);
router.use('/distributions', distributorsRouter);
router.use('/boxOfficeTypes', boxOfficeTypesRouter);
router.use('/places', placesRouter);
router.use('/events', eventsRouter);
router.use('/priceSpecifications', priceSpecificationsRouter);
router.use('/productOffers', productOffersRouter);
router.use('/reservations', reservationsRouter);
router.use('/serviceTypes', serviceTypesRouter);
router.use('/subjects', subjectRouter);
router.use('/ticketTypeGroups', offerCatalogsRouter);
router.use('/offerCatalogs', offerCatalogsRouter);
router.use('/ticketTypes', offersRouter);
router.use('/offers', offersRouter);
router.use('/transactions', transactionsRouter);

export default router;
