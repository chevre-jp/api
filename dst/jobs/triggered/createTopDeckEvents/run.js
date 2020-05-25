"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Chevreにトップデッキイベントを作成する
 */
const chevre = require("@chevre/domain");
const cron_1 = require("cron");
const createDebug = require("debug");
const moment = require("moment-timezone");
const connectMongo_1 = require("../../../connectMongo");
const singletonProcess = require("../../../singletonProcess");
const debug = createDebug('chevre-api:jobs');
exports.default = (params) => __awaiter(void 0, void 0, void 0, function* () {
    let holdSingletonProcess = false;
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        holdSingletonProcess = yield singletonProcess.lock({
            project: params.project,
            key: 'createTopDeckEvents',
            ttl: 60
        });
    }), 
    // tslint:disable-next-line:no-magic-numbers
    10000);
    const connection = yield connectMongo_1.connectMongo({ defaultConnection: false });
    const job = new cron_1.CronJob('0 * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        if (!holdSingletonProcess) {
            return;
        }
        // tslint:disable-next-line:no-floating-promises
        main(connection, params.project)
            .then(() => {
            // tslint:disable-next-line:no-console
            console.log('success!');
        })
            .catch((err) => {
            // tslint:disable-next-line:no-console
            console.error(err);
        });
    }), undefined, true);
    debug('job started', job.nextDate);
});
// イベント作成情報
const setting = {
    film: '001',
    theater: '001',
    ticket_type_group: '02',
    performance_duration: 15,
    no_performance_times: [
        '2215',
        '2230',
        '2245'
    ]
};
/**
 * 設定からイベントを作成する
 */
// tslint:disable-next-line:max-func-body-length
function main(connection, project) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        // 引数情報取得
        const targetInfo = getTargetInfoForCreateFromSetting(setting.performance_duration, setting.no_performance_times);
        debug('targetInfo:', targetInfo);
        const eventRepo = new chevre.repository.Event(connection);
        const offerCatalogRepo = new chevre.repository.OfferCatalog(connection);
        const placeRepo = new chevre.repository.Place(connection);
        const projectRepo = new chevre.repository.Project(connection);
        const taskRepo = new chevre.repository.Task(connection);
        // 劇場検索
        const movieTheaters = yield placeRepo.searchMovieTheaters({
            project: { ids: [project.id] }
        });
        const movieTheaterWithoutScreeningRoom = movieTheaters.find((d) => d.branchCode === setting.theater);
        if (movieTheaterWithoutScreeningRoom === undefined) {
            throw new Error('Movie Theater Not Found');
        }
        const movieTheater = yield placeRepo.findById({ id: movieTheaterWithoutScreeningRoom.id });
        debug('movieTheater:', movieTheater);
        const seller = movieTheater.parentOrganization;
        const screeningRoom = movieTheater.containsPlace[0];
        // 劇場作品検索
        const workPerformedIdentifier = setting.film;
        const searchScreeningEventSeriesResult = yield eventRepo.search({
            project: { ids: [project.id] },
            typeOf: chevre.factory.eventType.ScreeningEventSeries,
            workPerformed: { identifiers: [workPerformedIdentifier] }
        });
        const screeningEventSeries = searchScreeningEventSeriesResult[0];
        debug('screeningEventSeries:', screeningEventSeries);
        // オファーカタログ検索
        const offerCatalogCode = setting.ticket_type_group;
        const searchOfferCatalogsResult = yield offerCatalogRepo.search({
            limit: 1,
            project: { id: { $eq: project.id } },
            identifier: { $eq: offerCatalogCode }
        });
        const offerCatalog = searchOfferCatalogsResult[0];
        debug('offerCatalog:', offerCatalog);
        for (const performanceInfo of targetInfo) {
            const id = [
                // tslint:disable-next-line:no-magic-numbers
                performanceInfo.day.slice(-6),
                workPerformedIdentifier,
                movieTheater.branchCode,
                screeningRoom.branchCode,
                performanceInfo.start_time
            ].join('');
            const offers = {
                project: offerCatalog.project,
                // id: <string>offerCatalog.id,
                // name: offerCatalog.name,
                typeOf: chevre.factory.offerType.Offer,
                priceCurrency: chevre.factory.priceCurrency.JPY,
                availabilityEnds: moment(performanceInfo.end_date)
                    .tz('Asia/Tokyo')
                    .endOf('date')
                    .toDate(),
                availabilityStarts: moment(performanceInfo.start_date)
                    .tz('Asia/Tokyo')
                    .startOf('date')
                    // tslint:disable-next-line:no-magic-numbers
                    .add(-3, 'months')
                    .toDate(),
                eligibleQuantity: {
                    typeOf: 'QuantitativeValue',
                    unitCode: chevre.factory.unitCode.C62,
                    maxValue: 10,
                    value: 1
                },
                itemOffered: {
                    serviceType: {},
                    serviceOutput: {
                        typeOf: chevre.factory.reservationType.EventReservation,
                        reservedTicket: {
                            typeOf: 'Ticket',
                            ticketedSeat: { typeOf: chevre.factory.placeType.Seat }
                        }
                    }
                },
                seller: {
                    typeOf: (_a = seller) === null || _a === void 0 ? void 0 : _a.typeOf,
                    id: (_b = seller) === null || _b === void 0 ? void 0 : _b.id
                },
                validThrough: moment(performanceInfo.end_date)
                    .tz('Asia/Tokyo')
                    .endOf('date')
                    .toDate(),
                validFrom: moment(performanceInfo.start_date)
                    .tz('Asia/Tokyo')
                    .startOf('date')
                    // tslint:disable-next-line:no-magic-numbers
                    .add(-3, 'months')
                    .toDate(),
                acceptedPaymentMethod: [
                    chevre.factory.paymentMethodType.Cash,
                    chevre.factory.paymentMethodType.CreditCard,
                    chevre.factory.paymentMethodType.Others
                ]
            };
            // イベント作成
            const eventAttributes = Object.assign({ project: project, typeOf: chevre.factory.eventType.ScreeningEvent, eventStatus: chevre.factory.eventStatusType.EventScheduled, name: screeningEventSeries.name, doorTime: performanceInfo.door_time, startDate: performanceInfo.start_date, endDate: performanceInfo.end_date, workPerformed: screeningEventSeries.workPerformed, superEvent: screeningEventSeries, location: {
                    project: project,
                    typeOf: screeningRoom.typeOf,
                    branchCode: screeningRoom.branchCode,
                    name: screeningRoom.name,
                    alternateName: screeningRoom.alternateName,
                    address: screeningRoom.address
                }, offers: offers, checkInCount: undefined, attendeeCount: undefined, additionalProperty: [{ name: 'tourNumber', value: String(performanceInfo.tour_number) }] }, {
                hasOfferCatalog: {
                    typeOf: 'OfferCatalog',
                    id: offerCatalog.id
                }
            });
            const event = yield eventRepo.save({
                id: id,
                attributes: eventAttributes,
                upsert: true
            });
            debug('upserted', event.id);
            yield chevre.service.offer.onEventChanged(event)({
                event: eventRepo,
                project: projectRepo,
                task: taskRepo
            });
        }
    });
}
exports.main = main;
/**
 * パフォーマンス作成・作成対象情報取得
 */
function getTargetInfoForCreateFromSetting(duration, noPerformanceTimes) {
    const performanceInfos = [];
    // 作成対象時間: 9,10,11など
    const hours = ['9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22'];
    // 作成開始が今日から何日後か: 30
    const start = 91;
    // 何日分作成するか: 7
    const days = 1;
    const minutes = ['00', '15', '30', '45'];
    const tours = ['1', '2', '3', '4'];
    // 本日日付+開始日までの日数から作成開始日セット
    // 作成日数分の作成対象日付作成
    for (let index = 0; index < days; index = index + 1) {
        const now = moment()
            .add(start + index, 'days');
        hours.forEach((hourStr) => {
            // 2桁でない時は'0'詰め
            // tslint:disable-next-line:no-magic-numbers
            const hour = `0${hourStr}`.slice(-2);
            minutes.forEach((minute, minuteIndex) => {
                // ツアー情報作成
                const tourNumber = `${hour}${tours[minuteIndex]}`;
                const startDate = moment(`${now.format('YYYYMMDD')} ${hour}:${minute}:00+09:00`, 'YYYYMMDD HH:mm:ssZ');
                const endDate = moment(startDate)
                    .add(duration, 'minutes');
                const day = moment(startDate)
                    .tz('Asia/Tokyo')
                    .format('YYYYMMDD');
                const startTime = moment(startDate)
                    .tz('Asia/Tokyo')
                    .format('HHmm');
                const endTime = moment(endDate)
                    .tz('Asia/Tokyo')
                    .format('HHmm');
                // パフォーマンスを作成しない時刻に指定されていなかったら作成
                if (noPerformanceTimes.indexOf(`${hour}${minute}`) < 0) {
                    performanceInfos.push({
                        day: day,
                        start_time: startTime,
                        end_time: endTime,
                        door_time: startDate.toDate(),
                        start_date: startDate.toDate(),
                        end_date: endDate.toDate(),
                        tour_number: tourNumber,
                        duration: moment.duration(duration, 'minutes')
                            .toISOString()
                    });
                }
            });
        });
    }
    return performanceInfos;
}
