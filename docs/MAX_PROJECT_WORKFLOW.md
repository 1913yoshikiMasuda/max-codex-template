# Max Project workflow

`.maxproj` fileはMaxが管理します。patcher、code、media、local/global status、top-level patcher、Project search path、Project settingなどのProject contentが記録されます。作品がProject search pathに依存する場合は、個別のchild patchではなく `.maxproj` を開いてください。

templateは `.maxproj` を書き換えません。`max-tooling.config.json` は、1つ以上のMax Projectと、inspectionおよびlintの対象patchをそれぞれ独立して選択します。

```json
{
  "maxProjects": [
    "work.maxproj"
  ],
  "patches": [
    "patchers/**/*.maxpat"
  ],
  "lintBaseline": "maxpat-lint-baseline.json"
}
```

次を実行します。

```bash
npm run max:project:check
```

checkerは、Project名とsetting、登録されたすべてのcontent entry、local/global status、解決したpath、top-level status、記録されたProject search-path entryを報告します。path解決は保守的です。Project root、`patchers/` や `code/` など対応するcategory folder、Project root以下にある同名の一意なfilenameを確認します。

diagnosticは次のルールに従います。

- Project search pathが記録されておらず、local Project entryに対応するfileがない場合はerrorです。external Project search pathがある場合は、Maxの完全なsearch algorithmを意図的に再現していないため、Maxで確認すべきwarningとします。
- 複数のlocal fileが候補になる場合は、任意に1つを選ばずwarningにします。
- 解決されたProject patchがtooling側のpatch集合に含まれない場合はwarningです。
- tooling側のpatchが設定済みMax Projectに登録されていない場合はinformationalです。Projectへ属さないloose patchも利用できます。
- global Project entryは報告しますが、local fileの欠落とは扱いません。

このcommandは、Max runtimeのsearch algorithm全体の再現、external packageのinstall確認、global dependencyのlocal化、Project metadataの変更を行いません。runtime resolutionのauthorityはMaxにあります。checkerは再現可能なrepository auditを提供します。

Max上でProject membershipまたは構成を変更した場合は、`.maxproj` のdiffをレビューし、`max:project:check` を実行してください。選択されたproduction patch集合を意図的に変更した場合に限り、lint baselineを更新します。
