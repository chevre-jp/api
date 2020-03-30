# Chevre API Application

[![CircleCI](https://circleci.com/gh/chevre-jp/api.svg?style=svg)](https://circleci.com/gh/chevre-jp/api)

## Table of contents

* [Usage](#usage)
* [License](#license)

## Usage

### Environment variables

| Name                          | Required | Value        | Purpose                  |
| ----------------------------- | -------- | ------------ | ------------------------ |
| `COA_ENDPOINT`                | true     |              |                          |
| `COA_REFRESH_TOKEN`           | true     |              |                          |
| `DEBUG`                       | false    | chevre-api:* | Debug                    |
| `JOBS_STOPPED`                | true     |              |                          |
| `LINE_NOTIFY_URL`             | true     |              | LINE Notify URL          |
| `LINE_NOTIFY_ACCESS_TOKEN`    | true     |              | LINE Notify access token |
| `MONGOLAB_URI`                | true     |              | MongoDB Connection URI   |
| `NODE_ENV`                    | true     |              | Environment name         |
| `REDIS_PORT`                  | true     |              | Redis Cache Connection   |
| `REDIS_HOST`                  | true     |              | Redis Cache Connection   |
| `REDIS_KEY`                   | true     |              | Redis Cache Connection   |
| `REDIS_TLS_SERVERNAME`        | false    |              | Redis Cache Connection   |
| `RESOURECE_SERVER_IDENTIFIER` | true     |              |                          |
| `TOKEN_ISSUERS`               | true     |              |                          |

## License

ISC
