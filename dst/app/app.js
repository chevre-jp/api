"use strict";
/**
 * expressアプリケーション
 */
// import * as middlewares from '@motionpicture/express-middleware';
const bodyParser = require("body-parser");
const cors = require("cors");
// import * as createDebug from 'debug';
const express = require("express");
const expressValidator = require("express-validator");
const helmet = require("helmet");
const qs = require("qs");
const connectMongo_1 = require("../connectMongo");
const errorHandler_1 = require("./middlewares/errorHandler");
const notFoundHandler_1 = require("./middlewares/notFoundHandler");
const router_1 = require("./routes/router");
// const debug = createDebug('chevre-api:app');
const app = express();
app.set('query parser', (str) => qs.parse(str, {
    arrayLimit: 1000,
    parseArrays: true,
    allowDots: false,
    allowPrototypes: true
}));
const options = {
    origin: '*',
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'X-Access-Token', 'Authorization'],
    credentials: false,
    methods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'POST', 'DELETE'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};
app.use(cors(options));
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ['\'self\'']
        // styleSrc: ['\'unsafe-inline\'']
    }
}));
app.use(helmet.referrerPolicy({ policy: 'no-referrer' })); // 型定義が非対応のためany
const SIXTY_DAYS_IN_SECONDS = 5184000;
app.use(helmet.hsts({
    maxAge: SIXTY_DAYS_IN_SECONDS,
    includeSubdomains: false
}));
// api version
// tslint:disable-next-line:no-require-imports no-var-requires
const packageInfo = require('../../package.json');
app.use((__, res, next) => {
    res.setHeader('x-api-verion', packageInfo.version);
    next();
});
// view engine setup
// app.set('views', `${__dirname}/../../views`);
// app.set('view engine', 'ejs');
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));
app.use(expressValidator({})); // this line must be immediately after any of the bodyParser middlewares!
connectMongo_1.connectMongo({ defaultConnection: true }).then().catch((err) => {
    // tslint:disable-next-line:no-console
    console.error('connetMongo:', err);
    process.exit(1);
});
// routers
app.use('/', router_1.default);
// 404
app.use(notFoundHandler_1.default);
// error handlers
app.use(errorHandler_1.default);
module.exports = app;
