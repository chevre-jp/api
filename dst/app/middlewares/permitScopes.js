"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * スコープ許可ミドルウェア
 */
const chevre = require("@chevre/domain");
const createDebug = require("debug");
const iam_1 = require("../iam");
const debug = createDebug('chevre-api:middlewares');
exports.default = (specifiedPermittedScopes) => {
    return (req, __, next) => {
        if (process.env.RESOURECE_SERVER_IDENTIFIER === undefined) {
            next(new Error('RESOURECE_SERVER_IDENTIFIER undefined'));
            return;
        }
        let permittedScopes = [...specifiedPermittedScopes];
        // Permission.Adminは全アクセス許可
        permittedScopes.push(iam_1.Permission.Admin, iam_1.Permission.ChevreAdmin);
        permittedScopes = [...new Set(permittedScopes)];
        debug('permittedScopes:', permittedScopes);
        const ownedScopes = [...req.user.scopes];
        // const ownedScopes: string[] = [...req.user.scopes, ...req.memberPermissions];
        debug('ownedScopes:', ownedScopes);
        // ドメインつきのスコープリストも許容するように変更
        const permittedScopesWithResourceServerIdentifier = [
            ...permittedScopes.map((permittedScope) => `${process.env.RESOURECE_SERVER_IDENTIFIER}/${permittedScope}`),
            ...permittedScopes.map((permittedScope) => `${process.env.RESOURECE_SERVER_IDENTIFIER}/auth/${permittedScope}`)
        ];
        debug('permittedScopesWithResourceServerIdentifier:', permittedScopesWithResourceServerIdentifier);
        // スコープチェック
        try {
            debug('checking scope requirements...', permittedScopesWithResourceServerIdentifier);
            if (!isScopesPermitted(ownedScopes, permittedScopesWithResourceServerIdentifier)) {
                next(new chevre.factory.errors.Forbidden('scope requirements not satisfied'));
            }
            else {
                next();
            }
        }
        catch (error) {
            next(error);
        }
    };
};
/**
 * 所有スコープが許可されたスコープかどうか
 */
function isScopesPermitted(ownedScopes, permittedScopes) {
    debug('checking scope requirements...', permittedScopes);
    if (!Array.isArray(ownedScopes)) {
        throw new Error('ownedScopes should be array of string');
    }
    const permittedOwnedScope = permittedScopes.find((permittedScope) => ownedScopes.indexOf(permittedScope) >= 0);
    return (permittedOwnedScope !== undefined);
}
