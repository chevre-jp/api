"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Redis Cacheクライアント
 */
const chevre = require("@chevre/domain");
// import * as createDebug from 'debug';
// const debug = createDebug('waiter:redis');
let client;
function createClient() {
    const c = chevre.redis.createClient({
        // tslint:disable-next-line:no-magic-numbers
        port: Number(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_KEY,
        tls: { servername: process.env.REDIS_HOST }
    });
    c.on('error', (err) => {
        console.error(err);
    });
    // c.on('end', () => {
    //     debug('end');
    // });
    return c;
}
function getClient() {
    if (client === undefined) {
        client = createClient();
    }
    return client;
}
exports.getClient = getClient;
