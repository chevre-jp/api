/**
 * oauthミドルウェア
 */
import * as chevre from '@chevre/domain';

import { cognitoAuth } from '@motionpicture/express-middleware';
import * as createDebug from 'debug';

const debug = createDebug('chevre-api:middlewares');

// 許可発行者リスト
const ISSUERS = (<string>process.env.TOKEN_ISSUERS).split(',');

const authentication = cognitoAuth({
    issuers: ISSUERS,
    authorizedHandler: async (user, token, req, __, next) => {
        try {
            const identifier: chevre.factory.person.IIdentifier = [
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
                            value: String((<any>user)[key])
                        };
                    }));
            } catch (error) {
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
        } catch (error) {
            // AmazonCognitoAPIのレート制限をハンドリング
            if (error.name === 'TooManyRequestsException') {
                next(new chevre.factory.errors.RateLimitExceeded(`getUser ${error.message}`));
            } else {
                next(new chevre.factory.errors.Unauthorized(`${error.name}:${error.message}`));
            }
        }
    },
    unauthorizedHandler: (err, __1, __2, next) => {
        debug('unauthorized err handled', err);
        next(new chevre.factory.errors.Unauthorized(err.message));
    }
});

export default authentication;
