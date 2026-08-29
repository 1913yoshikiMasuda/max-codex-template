# Maxプロジェクトの作業指示

このリポジトリに対するすべての変更には、以下のルールを適用してください。妥当だが未知の `.maxpat` フィールドを保持し、小さくレビュー可能な変更を優先してください。

<!-- project-bootstrap:start -->
## Project固有情報

このrepositoryは未初期化のtemplateです。作品固有情報は、初回のbootstrap対話後にここへ記録されます。
<!-- project-bootstrap:end -->

## AGENTS.mdの確認通知

- このファイルを読んだターンでは、最初のユーザー向け応答に必ず「私はAGENTS.mdを確認しました。」と記載してください。
- 短い応答や、ツールを使用しない作業でも省略しないでください。

## Maxリファレンスの方針

- object、attribute、message、inlet、outletの仕様が不明な場合は、編集前にローカルへインストールされたMax 9のhelp、example、tutorialを検索してください。最初に `npm run max:help -- OBJECT_NAME` を使用します。
- 未確認のMax objectやattributeを作り出さないでください。古いMax releaseから引き継いだ動作が現在も同じだと仮定しないでください。
- Max 9のstandard objectを優先してください。externalを追加するときは、それがexternalであることを明記し、入手元とversionを記録して、依存を最小限にしてください。
- ローカルの根拠だけでは不十分な場合は、最新のCycling '74公式documentationを確認し、重要な互換性上の仮定を記録してください。

## Patching規約

- DSP signal chainは上から下へ配置してください。複数stageまたはmodule間のflowは左から右へ進めます。同じsection内で方向を何度も反転させないでください。
- 20 px gridを使用します。連続するobject間は縦に40 px以上、主要なprocessing lane間は80 px以上を目安にしてください。boxを重ねてはいけません。
- patch cordの交差を避けてください。長距離を走るcordが多い場合は、構造を見直してください。
- hidden patch cordは原則禁止です。`send`/`receive` は、意味のある長距離routingまたはmodule間routingに限って使用し、それぞれに意味の明確な名前を付けてください。
- top levelはarchitectureが分かる状態を保ってください。論理blockが約12〜15 objectを超える場合は、abstraction、subpatcher、または `bpatcher` を検討してください。
- 各主要blockに短いcommentを付けてください。object名を繰り返すのではなく、目的または理由を説明します。
- 重要なobjectには、`input_gain`、`onset_detector`、`audio_output` のような安定した意味上の `varname` を付けてください。Maxが生成するIDは不透明なままで構いませんが、scriptから `obj-37`、`thing1`、`foo` のような名前に依存してはいけません。
- Patching Modeは、回路またはarchitectureとして読みやすい状態を保ってください。end-user向けUIはPresentation Modeで構成し、presentationを整える目的だけでpatching viewを煩雑にしないでください。
- DSPとcontrol-messageのpathは、見た目にも区別してください。意味を色だけで伝えないでください。
- 納品前に一時的なdebug objectを削除してください。診断機能を意図的に残す場合は、group化してlabelを付けます。

## 必須チェック

patchを変更した作業の完了前に、以下を実行してください。

```bash
npm run max:typecheck
npm run max:test
npm run max:project:check
npm run max:inspect:all
npm run max:lint:all
npm run max:lint:baseline
```

Max Project file、patch探索範囲、baseline pathは `max-tooling.config.json` から取得します。`max:project:check` は `.maxproj` を変更せずに読み取り、登録されたlocal patcherとtooling側のpatch集合を比較します。local Project fileの欠落が確認された場合とlint errorが増加した場合はfailureとして扱い、未解決のexternal Project search-path entryはMaxで確認してください。既存のlint warningはinformationalであり、warningを0にする目的だけで一括修正してはいけません。commit済みbaselineを更新する場合に限り、明示的に `npm run max:lint:baseline:update` を実行し、そのdiffをレビューしてください。

## 既存プロジェクトへのmigration

- 既存の `package.json` には `max:*` scriptだけをmergeしてください。既存scriptやdependency全体を置換してはいけません。
- Max toolingは `tsconfig.max-tools.json` に分離し、application側のTypeScript設定から独立させてください。
- 既存作品を編集する前に、保護対象file、signal/control flow、起動順序、port、environment variable、external、message schema、selector、安定したobject IDを、project固有の `AGENTS.md` に記録してください。
- patchが `node.script` を使用する場合は、scriptが明示的なready signalを出すまでoperation messageを送らないでください。startupの責務が `script start` と `@autostart 1` のどちらにあるかを維持し、暗黙に併用または切り替えないでください。
- `node.script`のentry pointは`.js`または`.mjs`だけを使用し、`.cjs`は使用しないでください。repositoryが`"type": "module"`の場合は`.js`をESMとして記述します。
- Node for Maxまたはbrowser bridgeが存在する場合は、parse/normalize/serialize logicをMax、socket、processの副作用から分離し、Maxを起動せずにprotocol fixtureを実行できるようにしてください。

## 新規プロジェクトのbootstrap

- 通常作業の前に `.codex/project-bootstrap.json` を確認してください。`status` が `uninitialized` の場合は、実装を開始せずbootstrapを行います。ただし、ユーザーがこのtemplate自体の保守または改善を明示的に依頼した場合は、未初期化状態を維持したままtemplate作業を行ってください。
- ユーザーの依頼から、作品名、slug、概要、project type、input、output、runtime構成、external/package、安全要件、最初に実装する小さな機能を抽出してください。既に提供された情報を再質問してはいけません。
- 不足している必須情報だけを日本語で質問してください。external/packageが不要または未定の場合は、空のまま初期化できます。
- Maxは格納folder名と`.maxproj`名が異なるProjectの読み込みを拒否します。bootstrap preview前にrepositoryのfolder名がslugと完全一致することを確認し、不一致ならユーザー確認を得てfolderをrenameし、新しいpathでworkspaceを開き直してください。bootstrap commandに暗黙のfolder renameを追加してはいけません。
- 回答が揃ったら、最初に `npm run project:init -- ...` を `--write` なしで実行します。変更予定をユーザーへ提示し、確認を得てから同じcommandへ `--write` を追加してください。
- bootstrap後は `package.json`、`package-lock.json`、README、Project固有情報、`docs/PROJECT_BRIEF.md`、`max-tooling.config.json`、bootstrap stateが作品固有の値になったことを確認してください。
- templateに含まれるplaceholder `.maxproj` に限り、bootstrap commandによる一度だけのproject名変更とfile renameを許可します。初期化後の `.maxproj` はMaxが管理するread-only fileとして扱い、toolingから書き換えてはいけません。
- `status` が `initialized` の場合はbootstrapを再実行せず、現在のproject情報をtruthとして通常作業を進めてください。
- 初期化後に必須checkを実行し、`git diff` で意図したfileだけが変更されたことを確認してください。
