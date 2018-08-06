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
/**
 * パフォーマンスコントローラー
 */
const domain_1 = require("@chevre/domain");
const createDebug = require("debug");
const moment = require("moment");
const _ = require("underscore");
const debug = createDebug('chevre-api:*');
const DEFAULT_RADIX = 10;
/**
 * 検索する
 */
// tslint:disable-next-line:max-func-body-length
function search(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // tslint:disable-next-line:max-line-length
        const limit = (!_.isEmpty(req.query.limit)) ? parseInt(req.query.limit, DEFAULT_RADIX) : null;
        const page = (!_.isEmpty(req.query.page)) ? parseInt(req.query.page, DEFAULT_RADIX) : 1;
        // 上映日
        const day = (!_.isEmpty(req.query.day)) ? req.query.day : null;
        // 部門
        const section = (!_.isEmpty(req.query.section)) ? req.query.section : null;
        // フリーワード
        const words = (!_.isEmpty(req.query.words)) ? req.query.words : null;
        // この時間以降開始のパフォーマンスに絞る(timestamp milliseconds)
        // tslint:disable-line:max-line-length
        const startFrom = (!_.isEmpty(req.query.start_from)) ? parseInt(req.query.start_from, DEFAULT_RADIX) : null;
        // 劇場
        const theater = (!_.isEmpty(req.query.theater)) ? req.query.theater : null;
        // スクリーン
        const screen = (!_.isEmpty(req.query.screen)) ? req.query.screen : null;
        // 検索条件を作成
        const andConditions = [
            { canceled: false }
        ];
        if (day !== null) {
            andConditions.push({ day: day });
        }
        if (theater !== null) {
            andConditions.push({ theater: theater });
        }
        if (screen !== null) {
            andConditions.push({ screen: screen });
        }
        if (startFrom !== null) {
            const now = moment(startFrom);
            // tslint:disable-next-line:no-magic-numbers
            const tomorrow = moment(startFrom).add(+24, 'hours');
            andConditions.push({
                $or: [
                    {
                        day: now.format('YYYYMMDD'),
                        start_time: { $gte: now.format('HHmm') }
                    },
                    {
                        day: { $gte: tomorrow.format('YYYYMMDD') }
                    }
                ]
            });
        }
        // 作品条件を追加する
        yield addFilmConditions(andConditions, section, words);
        let conditions = null;
        if (andConditions.length > 0) {
            conditions = { $and: andConditions };
        }
        // 作品件数取得
        const filmIds = yield domain_1.Models.Performance.distinct('film', conditions).exec();
        // 総数検索
        const performancesCount = yield domain_1.Models.Performance.count(conditions).exec();
        // 必要な項目だけ指定すること(レスポンスタイムに大きく影響するので)
        debug('locale:', req.getLocale());
        const fields = (req.getLocale() === 'ja')
            ? 'day open_time start_time end_time film screen screen_name.ja theater theater_name.ja'
            : 'day open_time start_time end_time film screen screen_name.en theater theater_name.en';
        const query = domain_1.Models.Performance.find(conditions, fields);
        if (limit !== null) {
            query.skip(limit * (page - 1)).limit(limit);
        }
        if (req.getLocale() === 'ja') {
            query.populate('film', 'name.ja sections.name.ja minutes copyright rating');
        }
        else {
            query.populate('film', 'name.en sections.name.en minutes copyright rating');
        }
        // 上映日、開始時刻
        query.setOptions({
            sort: {
                day: 1,
                start_time: 1
            }
        });
        const performances = yield query.lean(true).exec();
        // 空席情報を追加
        let performanceStatuses;
        try {
            performanceStatuses = yield domain_1.PerformanceStatusesModel.find();
        }
        catch (error) {
            console.error(error);
        }
        const data = performances.map((performance) => {
            return {
                type: 'performances',
                id: performance._id,
                attributes: {
                    day: performance.day,
                    open_time: performance.open_time,
                    start_time: performance.start_time,
                    seat_status: (performanceStatuses !== undefined) ? performanceStatuses.getStatus(performance._id.toString()) : null,
                    theater_name: performance.theater_name[req.getLocale()],
                    screen_name: performance.screen_name[req.getLocale()],
                    film: performance.film._id,
                    film_name: performance.film.name[req.getLocale()],
                    film_sections: performance.film.sections.map((filmSection) => filmSection.name[req.getLocale()]),
                    film_minutes: performance.film.minutes,
                    film_copyright: performance.film.copyright,
                    film_image: `${process.env.FRONTEND_ENDPOINT}/images/film/${performance.film._id}.jpg`
                }
            };
        });
        res.json({
            meta: {
                number_of_performances: performancesCount,
                number_of_films: filmIds.length
            },
            data: data
        });
    });
}
exports.search = search;
/**
 * 作品に関する検索条件を追加する
 * @param andConditions パフォーマンス検索条件
 * @param section 作品部門
 * @param words フリーワード
 */
function addFilmConditions(andConditions, section, words) {
    return __awaiter(this, void 0, void 0, function* () {
        const filmAndConditions = [];
        if (section !== null) {
            // 部門条件の追加
            filmAndConditions.push({ 'sections.code': { $in: [section] } });
        }
        // フリーワードの検索対象はタイトル(日英両方)
        // 空白つなぎでOR検索
        if (words !== null) {
            // trim and to half-width space
            const trimmedWords = words.replace(/(^\s+)|(\s+$)/g, '').replace(/\s/g, ' ');
            const orConditions = trimmedWords.split(' ').filter((value) => (value.length > 0)).reduce((a, word) => {
                return a.concat({ 'name.ja': { $regex: `${word}` } }, { 'name.en': { $regex: `${word}` } });
            }, []);
            debug(orConditions);
            filmAndConditions.push({ $or: orConditions });
        }
        // 条件があれば作品検索してID条件として追加
        if (filmAndConditions.length > 0) {
            const filmIds = yield domain_1.Models.Film.distinct('_id', { $and: filmAndConditions }).exec();
            debug('filmIds:', filmIds);
            // 該当作品がない場合、filmIdsが空配列となりok
            andConditions.push({ film: { $in: filmIds } });
        }
    });
}
