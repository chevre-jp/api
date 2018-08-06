// tslint:disable:no-implicit-dependencies
/**
 * not foundハンドラーミドルウェアテスト
 */
import * as assert from 'assert';
import * as nock from 'nock';
import * as sinon from 'sinon';

import * as notFoundHandler from './notFoundHandler';

let sandbox: sinon.SinonSandbox;

describe('notFoundHandler.default()', () => {
    beforeEach(() => {
        nock.cleanAll();
        nock.disableNetConnect();
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        nock.cleanAll();
        nock.enableNetConnect();
        sandbox.restore();
    });

    it('NOT_FOUNDとなるはず', async () => {
        const params = {
            req: {},
            res: { status: () => params.res, json: () => params.res },
            next: () => undefined
        };

        // tslint:disable-next-line:no-magic-numbers
        sandbox.mock(params.res).expects('status').once().withExactArgs(404);
        sandbox.mock(params.res).expects('json').once();

        const result = await notFoundHandler.default(<any>params.req, <any>params.res);
        assert.equal(result, undefined);
        sandbox.verify();
    });
});
