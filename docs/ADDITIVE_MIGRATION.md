# 既存repositoryへのadditive migration

既存repositoryをsource of truthとして扱います。既存の `package.json`、application側のTypeScript設定、README、`.maxpat` file、runtime codeをtemplate版で置換してはいけません。

## 追加するfile

以下のpathをcopyします。導入先repositoryに既存のtest規約がある場合は、testの配置を調整してください。

```text
tools/shared/
tools/max-project/
tools/maxpat-inspect/
tools/maxpat-lint/
tools/max-help-search/
tests/fixtures/
tests/maxpat.test.ts
tests/max-help-search.test.ts
tests/project-config.test.ts
tsconfig.max-tools.json
max-tooling.config.json
maxpat-lint-baseline.json
```

repositoryに既存の `.maxproj` がある場合は、変更せずに使用します。Max Projectがない場合はMaxから作成し、そのpathを `max-tooling.config.json` へ追加してください。

導入先に互換性のあるTypeScript、`tsx`、Node typeがない場合に限り、templateの `devDependencies` をmergeします。

## Mergeするscript

既存applicationのscriptを削除またはrenameせず、`max:*` scriptを追加します。

```json
{
  "scripts": {
    "max:build": "tsc -p tsconfig.max-tools.json",
    "max:typecheck": "tsc -p tsconfig.max-tools.json --noEmit",
    "max:test": "node --import tsx --test tests/max-tooling/*.test.ts",
    "max:help": "tsx tools/max-help-search/cli.ts",
    "max:project:check": "tsx tools/max-project/cli.ts",
    "max:inspect": "tsx tools/maxpat-inspect/cli.ts",
    "max:inspect:all": "tsx tools/maxpat-inspect/project-cli.ts",
    "max:lint": "tsx tools/maxpat-lint/cli.ts",
    "max:lint:all": "tsx tools/maxpat-lint/project-cli.ts",
    "max:lint:baseline": "tsx tools/maxpat-lint/baseline.ts",
    "max:lint:baseline:update": "tsx tools/maxpat-lint/baseline.ts --write"
  }
}
```

導入先にある既存の `build`、`test`、`dev`、framework固有scriptは変更しません。

## Baselineの作成

1. 既存の `.maxproj` を `maxProjects` に、すべてのproduction patchを `patches` に設定します。
2. `npm run max:project:check` を実行します。Project fileを書き換えずに、欠落したlocal fileを解決し、coverage warningを確認します。
3. `npm run max:inspect:all` を実行し、検出されたfileを確認します。
4. `npm run max:lint:all` を実行します。warningを消す目的だけで既存patchを編集してはいけません。
5. `npm run max:lint:baseline:update` を一度だけ実行し、生成されたJSONをレビューします。
6. tooling migrationと一緒にbaselineをcommitします。
7. 通常のcheckには `npm run max:lint:baseline` を使用します。errorの増加はfailure、warningの変化はinformationalです。

## 記録すべきproject固有ルール

実装前に、現在のsignal/data flow、保護対象file、起動順序、process port、environment override、external/package dependency、message format、Max selector、安定したobject ID、browser route、必須verification commandを `AGENTS.md` へ追記してください。現在の動作をtruthとして記述し、提案段階のmigrationを早まってルール化しないでください。
