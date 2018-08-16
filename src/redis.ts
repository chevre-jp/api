/**
 * Redis Cacheクライアント
 */
import * as chevre from '@chevre/domain';
// import * as createDebug from 'debug';

// const debug = createDebug('waiter:redis');

let client: chevre.redis.RedisClient | undefined;

function createClient() {
    const c = chevre.redis.createClient({
        // tslint:disable-next-line:no-magic-numbers
        port: Number(<string>process.env.REDIS_PORT),
        host: <string>process.env.REDIS_HOST,
        password: <string>process.env.REDIS_KEY,
        tls: { servername: <string>process.env.REDIS_HOST }
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
