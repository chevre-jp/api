/**
 * cronルーター
 */
import * as chevre from '@chevre/domain';
import * as express from 'express';
import { NO_CONTENT } from 'http-status';
import * as mongoose from 'mongoose';

import { main } from '../../jobs/triggered/createTopDeckEvents/run';

const TOPDECK_PROJECT = process.env.TOPDECK_PROJECT;

const importEventsProjects = (typeof process.env.IMPORT_EVENTS_PROJECTS === 'string')
    ? process.env.IMPORT_EVENTS_PROJECTS.split(',')
    : [];

const cronRouter = express.Router();

cronRouter.get(
    '/createTopDeckEvents',
    async (_, res, next) => {
        try {
            if (typeof TOPDECK_PROJECT === 'string') {
                await main(mongoose.connection, { typeOf: chevre.factory.organizationType.Project, id: TOPDECK_PROJECT });
            }

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

cronRouter.get(
    '/importOffersFromCOA',
    async (_, res, next) => {
        try {
            const offerRepo = new chevre.repository.Offer(mongoose.connection);
            const placeRepo = new chevre.repository.Place(mongoose.connection);

            for (const projectId of importEventsProjects) {
                const movieTheaters = await placeRepo.searchMovieTheaters({
                    project: { ids: [projectId] }
                });

                for (const movieTheater of movieTheaters) {
                    try {
                        await chevre.service.offer.importFromCOA({
                            project: { typeOf: chevre.factory.organizationType.Project, id: projectId },
                            theaterCode: movieTheater.branchCode
                        })({
                            offer: offerRepo
                        });
                    } catch (error) {
                        console.error(error);
                    }
                }
            }

            res.status(NO_CONTENT)
                .end();
        } catch (error) {
            next(error);
        }
    }
);

export default cronRouter;
