# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/).

## Unreleased

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## v6.2.0 - 2019-10-29

### Added

- プロジェクトリポジトリを追加
- 予約取消取引に予約ステータス変更時イベントを追加
- プロジェクトの予約通知設定を取引に反映

### Changed

- 取引開始時のagent指定を拡張

### Fixed

- URLの指定がない場合にウェブフックトリガー処理が正常終了しないバグ対応

## v6.1.0 - 2019-10-25

### Added

- 予約取引に予約ステータス変更時イベントを追加

## v6.0.0 - 2019-09-20

### Changed

- 予約取引の予約番号発行プロセスと仮予約プロセスを分離
- 予約データに不要なイベント属性について最適化

## v5.1.1 - 2019-09-03

### Fixed

- 予約が存在しない場合に保留中予約取消タスクが失敗しないように調整

## v5.1.0 - 2019-09-03

### Changed

- 予約確定アクションのポストアクションに予約通知アクションを追加
- 予約取消アクションのポストアクションに予約通知アクションを追加
- install @chevre/domain@11.x.x

## v5.0.1 - 2019-08-09

### Changed

- update mongoose

## v5.0.0 - 2019-07-29

### Changed

- [@chevre/domain](https://www.npmjs.com/package/@chevre/domain)で再構築
- 予約管理サービスとして再構築
