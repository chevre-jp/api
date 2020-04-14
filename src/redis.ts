/**
 * Redis Cacheクライアント
 */
import * as redis from 'redis';

let client: redis.RedisClient | undefined;

function createClient() {
    const c = redis.createClient({
        port: Number(<string>process.env.REDIS_PORT),
        host: <string>process.env.REDIS_HOST,
        password: <string>process.env.REDIS_KEY,
        tls: (process.env.REDIS_TLS_SERVERNAME !== undefined) ? { servername: process.env.REDIS_TLS_SERVERNAME } : undefined
    });

    c.on('error', (err: any) => {
        console.error(err);
    });

    // c.on('end', () => {
    //     debug('end');
    // });

    return c;
}

export function getClient() {
    if (client === undefined) {
        client = createClient();
    }

    return client;
}
