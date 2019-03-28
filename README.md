# Chevre API Application

[![CircleCI](https://circleci.com/gh/chevre-jp/api.svg?style=svg)](https://circleci.com/gh/chevre-jp/api)

## Table of contents

* [Usage](#usage)
* [License](#license)

## Usage

### Environment variables

| Name                            | Required | Value        | Purpose                                  |
| ------------------------------- | -------- | ------------ | ---------------------------------------- |
| `DEBUG`                         | false    | chevre-api:* | Debug                                    |
| `NODE_ENV`                      | true     |              | Environment name                         |
| `MONGOLAB_URI`                  | true     |              | MongoDB Connection URI                   |
| `REDIS_PORT`                    | true     |              | Redis Cache Connection                   |
| `REDIS_HOST`                    | true     |              | Redis Cache Connection                   |
| `REDIS_KEY`                     | true     |              | Redis Cache Connection                   |
| `REDIS_TLS_SERVERNAME`          | false    |              | Redis Cache Connection                   |
| `CREATE_SAMPLE_EVENTS_DISABLED` | 1 or 0   |              | サンプルイベント自動生成ジョブ無効フラグ |

## License

ISC
