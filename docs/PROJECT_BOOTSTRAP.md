# 対話型project bootstrap

このtemplateから作成したrepositoryは、最初は `.codex/project-bootstrap.json` の `status` が `uninitialized` です。AI agentは通常の実装へ進む前にこの状態を確認し、作品固有のrepositoryへ初期化します。

ユーザーが `max-codex-template` 自体の保守または改善を明示的に依頼した場合は例外です。その場合は作品への初期化を行わず、`uninitialized` の状態を維持してtemplateを更新します。

## 対話の流れ

1. ユーザーの最初の依頼から、作品名、slug、概要、project type、input、output、runtime構成、external/package、安全要件、最初の小規模機能を抽出します。
2. 依頼文だけでは分からない必須項目に限って質問します。提供済みの情報は再質問しません。
3. 回答が揃ったら、`npm run project:init -- ...` を `--write` なしで実行します。
4. agentは、検証済みの設定値と変更予定fileをユーザーへ提示します。
5. ユーザーの確認後、同じcommandへ `--write` を追加して実行します。
6. Max toolingの必須checkと `git diff` の監査を行ってから、作品の設計または実装へ進みます。

## 必須情報

- 人間向けの作品名
- `package.json` と `.maxproj` に使うlowercase slug
- 作品概要
- project type
- 1つ以上のinput
- 1つ以上のoutput
- 1つ以上のruntime
- external/package。不要または未定の場合は省略可能
- 1つ以上の安全要件
- 最初に実装する小さな機能

## Commandの安全性

`project:init` は既定でpreview modeです。入力と現在のtemplate状態を検証し、変更予定を表示しますが、fileを変更しません。`--write` がある場合だけ変更します。

write前には以下を確認します。

- bootstrap stateが `uninitialized` である
- `package.json` と `package-lock.json` がtemplate名のままである
- placeholder `.maxproj` が存在し、内部project名がtemplate名のままである
- `max-tooling.config.json` がplaceholder `.maxproj` を参照している
- rename先の `.maxproj` が存在しない
- READMEとAGENTS.mdにbootstrap markerがある

初期化では次を行います。

- `package.json` と `package-lock.json` のproject名を更新
- `package.json` のdescriptionを更新
- placeholder `.maxproj` の内部project名を更新し、slugへrename
- `max-tooling.config.json` のMax Project参照を更新
- READMEのtitleと、README／AGENTS.mdのbootstrap blockを作品固有情報へ置換
- `docs/PROJECT_BRIEF.md` を生成
- 最後にbootstrap stateを `initialized` へ変更

bootstrap stateは最後に書き込まれます。初期化済みrepositoryに対する再実行はfailureになります。

## `.maxproj` の例外規則

通常の `.maxproj` はMaxが管理し、toolingはread-onlyで扱います。例外は、未初期化templateに同梱されたplaceholder `.maxproj` に対するbootstrap時の一度だけです。初期化後はこの例外を適用しません。Project membership、search path、dependency、layoutなどはMaxで管理してください。
