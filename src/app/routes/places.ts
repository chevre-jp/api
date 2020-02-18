/**
 * 場所ルーター
 */
import { Router } from 'express';

import movieTheaterRouter from './places/movieTheater';
import screeningRoomRouter from './places/screeningRoom';
import seatRouter from './places/seat';

const placesRouter = Router();

placesRouter.use('/movieTheater', movieTheaterRouter);
placesRouter.use('/screeningRoom', screeningRoomRouter);
placesRouter.use('/seat', seatRouter);

export default placesRouter;
