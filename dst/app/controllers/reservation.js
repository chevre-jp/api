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
 * 座席予約コントローラー
 */
const domain_1 = require("@chevre/domain");
const conf = require("config");
const http_status_1 = require("http-status");
const moment = require("moment");
const sendgrid = require("sendgrid");
// import * as validator from 'validator';
/**
 * 予約情報メールを送信する
 */
function transfer(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const id = req.params.id;
            const to = req.body.to;
            const reservation = yield domain_1.Models.Reservation.findOne({ _id: id, status: domain_1.ReservationUtil.STATUS_RESERVED }).exec();
            if (reservation === null) {
                res.status(http_status_1.NOT_FOUND);
                res.json({
                    data: null
                });
                return;
            }
            const titleJa = `${reservation.get('purchaser_name').ja}様よりCHEVRE_EVENT_NAMEのチケットが届いております`;
            // tslint:disable-next-line:max-line-length
            const titleEn = `This is a notification that you have been invited to Tokyo International Film Festival by Mr./Ms. ${reservation.get('purchaser_name').en}.`;
            res.render('email/resevation', {
                layout: false,
                reservations: [reservation],
                to: to,
                moment: moment,
                conf: conf,
                titleJa: titleJa,
                titleEn: titleEn,
                ReservationUtil: domain_1.ReservationUtil
            }, (renderErr, text) => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (renderErr instanceof Error) {
                        throw renderErr;
                    }
                    const mail = new sendgrid.mail.Mail(new sendgrid.mail.Email(conf.get('email.from'), conf.get('email.fromname')), `${titleJa} ${titleEn}`, new sendgrid.mail.Email(to), new sendgrid.mail.Content('text/plain', text));
                    const sg = sendgrid(process.env.SENDGRID_API_KEY);
                    const request = sg.emptyRequest({
                        host: 'api.sendgrid.com',
                        method: 'POST',
                        path: '/v3/mail/send',
                        headers: {},
                        body: mail.toJSON(),
                        queryParams: {},
                        test: false,
                        port: ''
                    });
                    yield sg.API(request);
                    res.status(http_status_1.NO_CONTENT).end();
                }
                catch (error) {
                    console.error('an email unsent.', error);
                    next(error);
                }
            }));
        }
        catch (error) {
            next(error);
        }
    });
}
exports.transfer = transfer;
/**
 * 入場履歴を追加する
 */
function checkin(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const reservation = yield domain_1.Models.Reservation.findByIdAndUpdate(req.params.id, {
                $push: {
                    checkins: {
                        when: moment().toDate(),
                        where: req.body.where,
                        why: req.body.why,
                        how: req.body.how // どうやって
                    }
                }
            }).exec();
            if (reservation === null) {
                res.status(http_status_1.NOT_FOUND).json({
                    data: null
                });
            }
            else {
                res.status(http_status_1.NO_CONTENT).end();
            }
        }
        catch (error) {
            next(error);
        }
    });
}
exports.checkin = checkin;
/**
 * ムビチケユーザーで検索する
 */
function findByMvtkUser(_, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // ひとまずデモ段階では、一般予約を10件返す
        const LIMIT = 10;
        try {
            const reservations = yield domain_1.Models.Reservation.find({
                purchaser_group: domain_1.ReservationUtil.PURCHASER_GROUP_CUSTOMER,
                status: domain_1.ReservationUtil.STATUS_RESERVED
            }).limit(LIMIT).exec();
            res.json({
                success: true,
                reservations: reservations
            });
        }
        catch (error) {
            res.json({
                success: false,
                reservations: []
            });
        }
    });
}
exports.findByMvtkUser = findByMvtkUser;
/**
 * IDで検索する
 */
function findById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const id = req.params.id;
        try {
            const reservation = yield domain_1.Models.Reservation.findOne({
                _id: id,
                status: domain_1.ReservationUtil.STATUS_RESERVED
            }).exec();
            res.json({
                success: true,
                reservation: reservation
            });
        }
        catch (error) {
            res.json({
                success: false,
                reservation: null
            });
        }
    });
}
exports.findById = findById;
