"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Redis Cacheクライアント
 */
const redis = require("redis");
let client;
function createClient() {
    const c = redis.createClient({
        port: Number(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_KEY,
        tls: (process.env.REDIS_TLS_SERVERNAME !== undefined) ? { servername: process.env.REDIS_TLS_SERVERNAME } : undefined
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
