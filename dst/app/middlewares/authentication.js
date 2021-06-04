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
 * oauthミドルウェア
 */
const chevre = require("@chevre/domain");
const express_middleware_1 = require("@motionpicture/express-middleware");
const createDebug = require("debug");
const debug = createDebug('chevre-api:middlewares');
// 許可発行者リスト
const ISSUERS = process.env.TOKEN_ISSUERS.split(',');
const authentication = express_middleware_1.cognitoAuth({
    issuers: ISSUERS,
    authorizedHandler: (user, token, req, __, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const identifier = [
                { name: 'tokenIssuer', value: user.iss },
                { name: 'clientId', value: user.client_id },
                { name: 'hostname', value: req.hostname },
                ...(typeof user.username === 'string') ? [{ name: 'username', value: user.username }] : []
            ];
            // リクエストユーザーの属性を識別子に追加
            try {
                identifier.push(...Object.keys(user)
                    .filter((key) => key !== 'scope' && key !== 'scopes') // スコープ情報はデータ量がDBの制限にはまる可能性がある
                    .map((key) => {
                    return {
                        name: String(key),
                        value: String(user[key])
                    };
                }));
            }
            catch (error) {
                // no op
            }
            // let programMembership: chevre.factory.chevre.programMembership.IProgramMembership | undefined;
            // if (typeof user.username === 'string') {
            //     programMembership = {
            //         membershipNumber: user.username,
            //         // name: 'Default Program Membership',
            //         programName: 'Default Program Membership',
            //         project: req.project,
            //         typeOf: chevre.factory.chevre.programMembership.ProgramMembershipType.ProgramMembership
            //         // url: user.iss
            //     };
            // }
            req.user = user;
            req.accessToken = token;
            // ログインユーザーであればPerson、クライアント認証であればアプリケーション
            req.agent = (typeof user.username === 'string')
                ? {
                    typeOf: chevre.factory.personType.Person,
                    id: user.sub,
                    identifier: identifier
                    // memberOf: programMembership
                }
                : {
                    typeOf: chevre.factory.chevre.creativeWorkType.WebApplication,
                    id: user.sub,
                    identifier: identifier
                };
            next();
        }
        catch (error) {
            // AmazonCognitoAPIのレート制限をハンドリング
            if (error.name === 'TooManyRequestsException') {
                next(new chevre.factory.errors.RateLimitExceeded(`getUser ${error.message}`));
            }
            else {
                next(new chevre.factory.errors.Unauthorized(`${error.name}:${error.message}`));
            }
        }
    }),
    unauthorizedHandler: (err, __1, __2, next) => {
        debug('unauthorized err handled', err);
        next(new chevre.factory.errors.Unauthorized(err.message));
    }
});
exports.default = authentication;
