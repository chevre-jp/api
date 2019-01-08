// tslint:disable:insecure-random no-magic-numbers
/**
 * サンプル上映イベントデータを作成する
 */
import * as chevre from '@chevre/domain';

import { CronJob } from 'cron';
import * as createDebug from 'debug';
import * as moment from 'moment';

import { connectMongo } from '../../../connectMongo';

const debug = createDebug('chevre-api:jobs');

export default async () => {
    const connection = await connectMongo({ defaultConnection: false });

    const job = new CronJob(
        '0 * * * *',
        async () => {
            const eventRepo = new chevre.repository.Event(connection);
            const placeRepo = new chevre.repository.Place(connection);
            const ticketTypeRepo = new chevre.repository.TicketType(connection);

            const eventSeriesList = await eventRepo.search<chevre.factory.eventType.ScreeningEventSeries>({
                typeOf: chevre.factory.eventType.ScreeningEventSeries
            });
            // イベントシリーズをランダム選定
            const eventSeries = eventSeriesList[Math.floor(Math.random() * eventSeriesList.length)];
            // 上映ルームをランダム選定
            const movieTheater = await placeRepo.findMovieTheaterByBranchCode({ branchCode: eventSeries.location.branchCode });
            const screeningRooms = movieTheater.containsPlace;
            const screeningRoom = <chevre.factory.place.movieTheater.IScreeningRoom>
                screeningRooms[Math.floor(Math.random() * screeningRooms.length)];
            const maximumAttendeeCapacity = screeningRoom.containsPlace.reduce((a, b) => a + b.containsPlace.length, 0);
            const ticketTypeGroups = await ticketTypeRepo.searchTicketTypeGroups({});
            // 券種グループをランダム選定
            const ticketTypeGroup = ticketTypeGroups[Math.floor(Math.random() * ticketTypeGroups.length)];
            const duration = Math.floor((Math.random() * 90) + 90);
            const delay = Math.floor(Math.random() * 780);
            const doorTime = moment(`${moment().add(Math.floor(Math.random() * 7), 'days').format('YYYY-MM-DD')}T09:00:00+09:00`)
                .add(delay, 'minutes').toDate();
            const startDate = moment(doorTime).add(10, 'minutes').toDate();
            const endDate = moment(startDate).add(duration, 'minutes').toDate();
            const offers: chevre.factory.event.screeningEvent.IOffer = {
                id: ticketTypeGroup.id,
                name: ticketTypeGroup.name,
                typeOf: 'Offer',
                priceCurrency: chevre.factory.priceCurrency.JPY,
                availabilityEnds: endDate,
                availabilityStarts: moment(startDate).add(-7, 'days').toDate(),
                validFrom: moment(startDate).add(-3, 'days').toDate(),
                validThrough: endDate,
                eligibleQuantity: {
                    value: 4,
                    unitCode: chevre.factory.unitCode.C62,
                    typeOf: 'QuantitativeValue'
                },
                itemOffered: {
                    serviceType: {
                        typeOf: 'ServiceType',
                        id: '',
                        name: ''
                    }
                }
            };
            const eventAttributes: chevre.factory.event.screeningEvent.IAttributes = {
                typeOf: chevre.factory.eventType.ScreeningEvent,
                name: eventSeries.name,
                duration: moment.duration(duration, 'minutes').toISOString(),
                doorTime: doorTime,
                startDate: startDate,
                endDate: endDate,
                eventStatus: chevre.factory.eventStatusType.EventScheduled,
                location: {
                    typeOf: <chevre.factory.placeType.ScreeningRoom>screeningRoom.typeOf,
                    branchCode: screeningRoom.branchCode,
                    name: screeningRoom.name,
                    alternateName: screeningRoom.alternateName,
                    address: screeningRoom.address,
                    description: screeningRoom.description
                },
                workPerformed: eventSeries.workPerformed,
                superEvent: eventSeries,
                offers: offers,
                maximumAttendeeCapacity: maximumAttendeeCapacity,
                remainingAttendeeCapacity: maximumAttendeeCapacity,
                checkInCount: 0,
                attendeeCount: 0
            };
            await eventRepo.saveScreeningEvent({ attributes: eventAttributes });
        },
        undefined,
        true
    );
    debug('job started', job);
};
