/**
 * イベントルーター
 */
import { Router } from 'express';

import screeningEventRouter from './events/screeningEvent';
import screeningEventSeriesRouter from './events/screeningEventSeries';

const eventsRouter = Router();
eventsRouter.use('/screeningEvent', screeningEventRouter);
eventsRouter.use('/screeningEventSeries', screeningEventSeriesRouter);
export default eventsRouter;
