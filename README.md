# max-codex-template

Max developerとCodexが共同で作業するための、小さく実用的なMax 9プロジェクト基盤です。成果物を `.maxpat` のまま維持しながら、構造とlayoutをレビュー可能にするread-onlyのTypeScript toolを提供します。

<!-- project-bootstrap:start -->
## 新規プロジェクトの初期設定

このrepositoryは未初期化のtemplateです。AI agentへ作りたい作品を説明すると、既に提供された情報を利用し、不足項目だけを日本語で質問します。設定内容のpreviewを確認した後、agentが `npm run project:init` を実行して作品固有のrepositoryへ初期化します。詳しくは [docs/PROJECT_BOOTSTRAP.md](docs/PROJECT_BOOTSTRAP.md) を参照してください。
<!-- project-bootstrap:end -->

## クイックスタート

Node.js 20以降が必要です。help検索には、ローカルへインストールされたMaxも必要です。

```bash
npm install
npm run max:project:check
npm run max:lint:all
npm run max:inspect:all
npm run max:lint:baseline
npm run max:help -- cycle~
```

nested subpatcherを含めて `max:inspect` を実行するには、`--recursive` を指定します。必要に応じてMaxの探索先をoverrideできます。

```bash
MAX_HOME=/path/to/Max.app npm run max:help -- pfft~
```

開発時のcheckは `npm run max:typecheck`、`npm run max:build`、`npm run max:test` です。prefixなしの `typecheck`、`build`、`test` は、この単独template内では互換aliasとして残しています。既存application repositoryには `max:*` scriptだけをmergeしてください。

## このtemplateからプロジェクトを始める

1. このtemplateから新しいrepositoryを作成します。またはGit historyを含めずにcopyします。
2. 作品またはsystemに合わせてrepository名を変更します。
3. repository rootをCodexで開き、作りたい作品を説明します。
4. Codexから不足情報を質問された場合は回答し、提示された初期化previewを確認します。
5. Codexが `project:init --write` と必須checkを実行した後、作品の設計と実装へ進みます。

手動で初期化する場合も、まずpreviewを実行してください。list optionは必要な回数だけ繰り返せます。

```bash
npm run project:init -- \
  --name "Spectral Garden Synth" \
  --slug spectral-garden-synth \
  --description "演奏で音響構造が育つシンセサイザー" \
  --type max-audio \
  --input MIDI \
  --output "stereo audio" \
  --runtime "Max 9" \
  --safety "起動時は無音" \
  --first-feature "安全な単音voice"
```

previewを確認後、同じcommandへ `--write` を追加すると初期化します。初期化済みrepositoryへの再実行は拒否されます。

repositoryの単位は、1つの作品、system、またはclient projectです。1つのpatchに限定しません。copy後の各projectは独立したGit repositoryであり、このtemplateをsubmoduleとして利用する想定ではありません。詳しくは [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) を参照してください。

## Tool

- `max:inspect` は、object、semantic name、rectangle、connection、inline subpatcher、参照先bpatcherを報告します。
- `max:inspect:all` は、`max-tooling.config.json` で選択されたすべてのpatchをinspectします。
- `max:project:check` は、設定された `.maxproj` を読み、登録contentを保守的に解決して、欠落したlocal fileやtooling checkから漏れたpatchを報告します。Max Projectを書き換えることはありません。
- `max:lint` は、壊れたconnectionと重複semantic nameに加えて、layoutおよび保守性に関する保守的なwarningを検出します。thresholdは1つのconfig moduleに集約されています。
- `max:lint:all` は、設定されたすべてのpatchをcheckします。`max:lint:baseline` はlint errorの増加時にfailureとなり、warningを0にすることは要求せず、warningの変化を報告します。
- `max:help` は、ローカルMaxのhelp、reference、tutorial、exampleのfilenameを検索します。`MAX_HOME`、macOSの標準的なinstallation、`~/Documents/Max 9/Packages` を探索し、C74とuser packageの結果を区別して表示します。

すべてのtoolはread-onlyです。shared parserは、現在必要なfieldだけを意図的にmodel化し、元document全体をmemory内に保持します。これにより、現時点でDSLを導入せず、将来declarative generatorを追加できる余地を残しています。

## Repository構成

基本構成を維持しつつ、2つの小さな追加があります。`tools/shared` はparse logicの重複を避け、`tests/fixtures` はMaxに依存しない最小fixtureを保持します。`tsconfig.json` はTypeScript toolchainを支えます。

```text
docs/                 workflowとpatchingの指針
.codex/project-bootstrap.json 対話型初期化の状態
patchers/main.maxpat  standard objectだけを使った検証済みsample
tools/shared/         小さく再利用可能なmaxpat parser
tools/project-bootstrap/ 一度限りのproject初期化CLI
tools/maxpat-inspect/ structure inspection CLI
tools/maxpat-lint/    diagnostics CLIと集約されたthreshold
tools/max-help-search/local Max resourceの検索
tests/fixtures/       再現可能なparser/linter input
max-tooling.config.json patch globとbaseline pathの設定
maxpat-lint-baseline.json commitするlint regression baseline
*.maxproj             Maxが管理し、read-onlyでcheckするproject metadata
```

`.maxproj` の扱いは [docs/MAX_PROJECT_WORKFLOW.md](docs/MAX_PROJECT_WORKFLOW.md) を参照してください。既存のNode/Vite/React repositoryへ導入する場合は [docs/ADDITIVE_MIGRATION.md](docs/ADDITIVE_MIGRATION.md) に従ってください。`node.script` を利用するprojectでは [docs/recipes/NODE_FOR_MAX.md](docs/recipes/NODE_FOR_MAX.md) も適用してください。

## License

MIT Licenseです。詳しくは [LICENSE](LICENSE) を参照してください。
