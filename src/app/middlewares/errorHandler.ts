/**
 * エラーハンドラーミドルウェア
 * todo errの内容、エラーオブジェクトタイプによって、本来はステータスコードを細かくコントロールするべき
 * 現時点では、雑にコントロールしてある
 */
import * as createDebug from 'debug';
import { NextFunction, Request, Response } from 'express';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from 'http-status';

const debug = createDebug('chevre-api:*');

export default (err: any, __: Request, res: Response, next: NextFunction) => {
    debug(err);

    if (res.headersSent) {
        next(err);

        return;
    }

    // エラーオブジェクトの場合は、キャッチされた例外でクライント依存のエラーの可能性が高い
    if (err instanceof Error) {
        // oauth認証失敗
        if (err.name === 'UnauthorizedError') {
            res.status(UNAUTHORIZED).end('Unauthorized');
        } else {
            res.status(BAD_REQUEST).json({
                errors: [
                    {
                        title: err.name,
                        detail: err.message
                    }
                ]
            });
        }
    } else {
        res.status(INTERNAL_SERVER_ERROR).json({
            errors: [
                {
                    title: 'internal server error',
                    detail: 'an unexpected error occurred.'
                }
            ]
        });
    }
};
