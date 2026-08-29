# Template architecture

想定するlifecycleは次のとおりです。

```text
max-codex-template
        ↓ copyまたはrepository template
individual-max-project（独立したGit repository）
```

1つのrepositoryは、1つの作品、system、または案件を表します。複数のtop-level patch、abstraction、media asset、JavaScript、external、project documentationを含められます。「1 patch = 1 repository」というルールではありません。

tool間で共有するのは、小さなread-only parserだけです。inspectionとlintは同じ `.maxpat` 表現を使用し、source fileを書き換えません。project-level commandは、`max-tooling.config.json` から `.maxproj` とpatch globを解決します。Max Project checkerは、Maxが管理するproject contentと、独立して設定されたtooling側のpatch集合を比較します。どちらかが暗黙にもう一方を置き換えることはありません。help searcherはproject patchをparseせず、インストール済みMax treeを検索するため独立しています。この分離によりtemplateを小さく保ちつつ、将来generatorを追加する場合も、generationをlint outputへ結合せずにparser typeを再利用できます。

lint baselineはcommitされるregression記録であり、formatting目標ではありません。errorの増加はfailureです。warningとcodeごとの差分は、表示されるinformational情報として残ります。baselineの更新は明示操作に限定されるため、通常のcheckでproject stateが書き換わることはありません。

templateからcopyしたprojectは、このrepositoryをsubmoduleとして参照しません。これによりtooling versionの変更が進行中の作品へ暗黙に影響することを防ぎ、project固有規約を独立して発展させられます。parser、linter、search toolが複数projectで成熟した場合は、将来、別途version管理する `max-codex-tools` package/repositoryへ移動できます。

今後の拡張候補は、external/bpatcher dependency inventory、未知fieldを保持するdeclarative patch-spec writer、Max-aware integration testです。現在のtemplateでは、いずれも必須ではありません。
