# Max reference workflow

object、message、attribute、connection contractが不明な場合は、次の手順を使用します。

1. `~`、namespace、想定されるversion制約を含め、正確なobject名を記録します。
2. Maxを探索します。`npm run max:help -- OBJECT_NAME` を実行し、標準外のmacOS locationにMaxがある場合は `MAX_HOME` を設定します。
3. 該当する `.maxhelp` candidateを開き、object-box text、attribute、inlet/outletの数とtype、dependency noteを確認します。
4. 検索結果に含まれる関連exampleとtutorialを確認します。filenameだけで使用例が分からない場合は、Maxの `Resources/C74` treeを検索します。
5. 既存patchにある実際のconnectionとmessageを比較します。exampleは根拠として扱い、無条件にcopyするtextとして扱いません。
6. 動作がインストール済みMax 9 releaseの仕様であることを確認します。standardではない各objectがexternalかを特定し、package/versionを記録します。
7. ローカルresourceだけで解決しない場合に限り、最新のCycling '74公式documentationを確認します。残る仮定はpatchまたはproject docsに明記してください。

search toolが報告するのは、filename/pathの関連度です。attributeやmessageの妥当性を証明するものではありません。実装前に該当contentを確認してください。developer固有のMax installation pathをproject sourceへhard-codeしてはいけません。
