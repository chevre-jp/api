"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * エラーハンドラーミドルウェア
 * todo errの内容、エラーオブジェクトタイプによって、本来はステータスコードを細かくコントロールするべき
 * 現時点では、雑にコントロールしてある
 */
const createDebug = require("debug");
const http_status_1 = require("http-status");
const debug = createDebug('chevre-api:*');
exports.default = (err, __, res, next) => {
    debug(err);
    if (res.headersSent) {
        next(err);
        return;
    }
    // エラーオブジェクトの場合は、キャッチされた例外でクライント依存のエラーの可能性が高い
    if (err instanceof Error) {
        // oauth認証失敗
        if (err.name === 'UnauthorizedError') {
            res.status(http_status_1.UNAUTHORIZED).end('Unauthorized');
        }
        else {
            res.status(http_status_1.BAD_REQUEST).json({
                errors: [
                    {
                        title: err.name,
                        detail: err.message
                    }
                ]
            });
        }
    }
    else {
        res.status(http_status_1.INTERNAL_SERVER_ERROR).json({
            errors: [
                {
                    title: 'internal server error',
                    detail: 'an unexpected error occurred.'
                }
            ]
        });
    }
};
