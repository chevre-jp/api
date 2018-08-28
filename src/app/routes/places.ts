/**
 * 場所ルーター
 */
import { Router } from 'express';

import movieTheaterRouter from './places/movieTheater';

const placesRouter = Router();
placesRouter.use('/movieTheater', movieTheaterRouter);
export default placesRouter;
