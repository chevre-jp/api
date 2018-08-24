/**
 * ルーター
 */
import * as express from 'express';

import creativeWorksRouter from './creativeWorks';
import devRouter from './dev';
import eventsRouter from './events';
import placesRouter from './places';
import reservationsRouter from './reservations';
import cancelReservationTransactionsRouter from './transactions/cancelReservation';
import reserveTransactionsRouter from './transactions/reserve';
const router = express.Router();

// middleware that is specific to this router
// router.use((req, res, next) => {
//   debug('Time: ', Date.now())
//   next()
// })

router.use('/creativeWorks', creativeWorksRouter);
router.use('/places', placesRouter);
router.use('/events', eventsRouter);
router.use('/reservations', reservationsRouter);
router.use('/transactions/cancelReservation', cancelReservationTransactionsRouter);
router.use('/transactions/reserve', reserveTransactionsRouter);

// tslint:disable-next-line:no-single-line-block-comment
/* istanbul ignore next */
if (process.env.NODE_ENV !== 'production') {
    router.use('/dev', devRouter);
}

export default router;
