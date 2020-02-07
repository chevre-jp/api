/**
 * 場所ルーター
 */
import { Router } from 'express';

import movieTheaterRouter from './places/movieTheater';
import seatRouter from './places/seat';

const placesRouter = Router();

placesRouter.use('/movieTheater', movieTheaterRouter);
placesRouter.use('/seat', seatRouter);

export default placesRouter;
