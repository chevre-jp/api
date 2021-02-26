"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * cronルーター
 */
const chevre = require("@chevre/domain");
const express = require("express");
const http_status_1 = require("http-status");
const mongoose = require("mongoose");
const run_1 = require("../../jobs/triggered/createTopDeckEvents/run");
const TOPDECK_PROJECT = process.env.TOPDECK_PROJECT;
const cronRouter = express.Router();
cronRouter.get('/createTopDeckEvents', (_, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (typeof TOPDECK_PROJECT === 'string') {
            yield run_1.main(mongoose.connection, { typeOf: chevre.factory.organizationType.Project, id: TOPDECK_PROJECT });
        }
        res.status(http_status_1.NO_CONTENT)
            .end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = cronRouter;
