/**
 * ルーター
 */
import * as express from 'express';

import accountTitlesRouter from './accountTitles';
import boxOfficeTypesRouter from './boxOfficeTypes';
import creativeWorksRouter from './creativeWorks';
import distributeRouter from './distributions/distributeRouter';
import eventsRouter from './events';
import placesRouter from './places';
import priceSpecificationsRouter from './priceSpecifications';
import reservationsRouter from './reservations';
import serviceTypesRouter from './serviceTypes';
import subjectRouter from './subject';
import ticketTypeGroupsRouter from './ticketTypeGroups';
import ticketTypesRouter from './ticketTypes';
import transactionsRouter from './transactions';
const router = express.Router();

// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })

router.use('/accountTitles', accountTitlesRouter);
router.use('/creativeWorks', creativeWorksRouter);
router.use('/distributions', distributeRouter);
router.use('/boxOfficeTypes', boxOfficeTypesRouter);
router.use('/places', placesRouter);
router.use('/events', eventsRouter);
router.use('/priceSpecifications', priceSpecificationsRouter);
router.use('/reservations', reservationsRouter);
router.use('/serviceTypes', serviceTypesRouter);
router.use('/subjects', subjectRouter);
router.use('/ticketTypeGroups', ticketTypeGroupsRouter);
router.use('/ticketTypes', ticketTypesRouter);
router.use('/transactions', transactionsRouter);

export default router;
