/**
 * 場所ルーター
 */
import { Router } from 'express';

import movieTheaterRouter from './places/movieTheater';
import screeningRoomRouter from './places/screeningRoom';
import screeningRoomSectionRouter from './places/screeningRoomSection';
import seatRouter from './places/seat';

const placesRouter = Router();

placesRouter.use('/movieTheater', movieTheaterRouter);
placesRouter.use('/screeningRoom', screeningRoomRouter);
placesRouter.use('/screeningRoomSection', screeningRoomSectionRouter);
placesRouter.use('/seat', seatRouter);

export default placesRouter;
