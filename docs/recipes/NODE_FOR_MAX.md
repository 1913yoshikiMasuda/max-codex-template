# Node for Maxのlifecycleとprotocol test

projectに `node.script` が含まれる場合に、この任意recipeを使用します。Maxだけで完結する作品では必要ありません。

## Entry fileの拡張子

- `node.script`へ渡すentry pointは、Node for Maxの公式仕様にある`.js`または`.mjs`を使用してください。
- `.cjs`は`node.script`のentry pointとして使用しないでください。CommonJSで実装する場合もentry fileは`.js`にし、ESMを明示する場合は`.mjs`または`package.json`の`type`設定と整合する`.js`を使用します。
- repositoryが`"type": "module"`の場合、`.js` entryはESMとして記述し、`max-api`はES module importで読み込みます。

## Startupの責務

startupを担当する方法を1つ選び、記録してください。

- `node.script ... @autostart 1` でpatchと同時に起動する。または
- 明示的な `script start` messageにより、patch/operatorの操作下でprocessを起動する。

この方針を暗黙に切り替えないでください。`script start` は `node.script` objectへのcommandであり、JavaScript handlerが処理するapplication commandではありません。

Nodeの初期化はasynchronousです。最初にhandlerを登録し、必要なresourceを初期化して、scriptがoperation inputを安全に処理できる状態になってから明示的なready messageを出力します。Max側では、readyになるまでstartup/default messageをgateの後ろへ保持してください。これにより `Node script not ready can't handle message ...` のようなwarningを防ぎ、初期scene、mode、URL、arm stateの喪失を避けられます。

推奨lifecycleは次のとおりです。

```text
load patch
  → start node.script
  → register Max handlers
  → initialize configuration/server/resources
  → outlet ready 1
  → open Max-side command gate
  → send initial operational state
```

## 責務の分離

`node.script` のentry moduleはI/Oだけを担当させます。

- `max-api` handlerの登録とoutlet
- process environment
- server、socket、file、timer
- lifecycleとerror reporting

決定的な処理は、副作用のないmoduleへ移動します。

- Max atom/messageからtextへの変換
- parseとnormalization
- raw JSONの保持
- serialization
- browser/server response formatting
- configuration defaultとoverrideの解決

公開selector、message順序、JSON field名、port、query parameter、environment variableはexternal interfaceです。taskがprotocol migrationを明示的に許可しない限り維持してください。

## MaxからNodeへ渡すmacOS path

`opendialog`などが返すpathは、macOS上でも`Macintosh HD:/Users/...`のようなMaxのvolume表現や、symbol内のbackslash escapeを含む場合があります。そのままNodeの`path.resolve()`へ渡すとentry fileのdirectoryからの相対pathとして扱われます。

- filesystem APIを呼ぶ前に、Max atomの復元とpath normalizationを副作用のないmoduleで行います。
- 起動volumeは`/Users/...`などのPOSIX absolute path、外付けvolumeは`/Volumes/<volume-name>/...`を候補として実在確認します。
- space、underscoreなどを含む実例をfixture testに固定します。
- Max側では必要に応じて`conformpath`を使いますが、Node側の境界でも受信形式を検証します。

## Fixture test

人間が読めるfixtureはtest codeから分離して保存します。各caseで `input` と `expected` の値が分かるようにしてください。

```text
tests/node-for-max/fixtures/
  max-messages.json
  json-commands.json
  remote-messages.json
  configuration.json
```

最低限、現在使われているcommand、raw JSON passthrough、outbound frame serialization、inbound outlet selector/text、default port、environment override、origin/authの動作、仕様が明確なinvalid inputを固定します。これらのtestはMaxを起動せず、network socketを開かずに実行してください。

invalid inputに対する動作が曖昧な場合は、fixture抽出時に新しいvalidation policyを導入せず、未規定として記録してください。
