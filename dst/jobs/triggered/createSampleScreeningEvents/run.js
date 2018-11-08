"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:insecure-random no-magic-numbers
/**
 * サンプル上映イベントデータを作成する
 */
const chevre = require("@chevre/domain");
const cron_1 = require("cron");
const createDebug = require("debug");
const moment = require("moment");
const connectMongo_1 = require("../../../connectMongo");
const debug = createDebug('chevre-api:jobs');
exports.default = () => __awaiter(this, void 0, void 0, function* () {
    const connection = yield connectMongo_1.connectMongo({ defaultConnection: false });
    const job = new cron_1.CronJob('0 * * * *', () => __awaiter(this, void 0, void 0, function* () {
        const eventRepo = new chevre.repository.Event(connection);
        const placeRepo = new chevre.repository.Place(connection);
        const ticketTypeRepo = new chevre.repository.TicketType(connection);
        const eventSeriesList = yield eventRepo.searchScreeningEventSeries({});
        // イベントシリーズをランダム選定
        const eventSeries = eventSeriesList[Math.floor(Math.random() * eventSeriesList.length)];
        // 上映ルームをランダム選定
        const movieTheater = yield placeRepo.findMovieTheaterByBranchCode(eventSeries.location.branchCode);
        const screeningRooms = movieTheater.containsPlace;
        const screeningRoom = screeningRooms[Math.floor(Math.random() * screeningRooms.length)];
        const maximumAttendeeCapacity = screeningRoom.containsPlace.reduce((a, b) => a + b.containsPlace.length, 0);
        const ticketTypeGroups = yield ticketTypeRepo.searchTicketTypeGroups({});
        // 券種グループをランダム選定
        const ticketTypeGroup = ticketTypeGroups[Math.floor(Math.random() * ticketTypeGroups.length)];
        const duration = Math.floor((Math.random() * 90) + 90);
        const delay = Math.floor(Math.random() * 780);
        const doorTime = moment(`${moment().add(Math.floor(Math.random() * 7), 'days').format('YYYY-MM-DD')}T09:00:00+09:00`)
            .add(delay, 'minutes').toDate();
        const startDate = moment(doorTime).add(10, 'minutes').toDate();
        const endDate = moment(startDate).add(duration, 'minutes').toDate();
        const offers = {
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
            }
        };
        const eventAttributes = {
            typeOf: chevre.factory.eventType.ScreeningEvent,
            name: eventSeries.name,
            duration: moment.duration(duration, 'minutes').toISOString(),
            doorTime: doorTime,
            startDate: startDate,
            endDate: endDate,
            eventStatus: chevre.factory.eventStatusType.EventScheduled,
            location: {
                typeOf: screeningRoom.typeOf,
                branchCode: screeningRoom.branchCode,
                name: screeningRoom.name,
                alternateName: screeningRoom.alternateName,
                address: screeningRoom.address,
                description: screeningRoom.description
            },
            workPerformed: eventSeries.workPerformed,
            superEvent: eventSeries,
            ticketTypeGroup: ticketTypeGroup.id,
            offers: offers,
            maximumAttendeeCapacity: maximumAttendeeCapacity,
            remainingAttendeeCapacity: maximumAttendeeCapacity,
            checkInCount: 0,
            attendeeCount: 0
        };
        yield eventRepo.saveScreeningEvent({ attributes: eventAttributes });
    }), undefined, true);
    debug('job started', job);
});
