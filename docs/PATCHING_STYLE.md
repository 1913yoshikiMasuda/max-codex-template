# Patching style

このguideは、2次元のMax programとしても、toolがレビューするstructured dataとしても、patchを読みやすくするためのものです。

## Flowとsection

DSP lane内ではsourceをprocessorの上に、sinkをその下に配置します。input、analysis、transformation、outputのような大きなstage間は、左から右へ進めます。space節約だけを理由に、sectionの主要方向を反転させないでください。

DSPとcontrolの領域を空間的に分けます。control sourceは操作対象objectの近くに配置し、signal trunkは見た目にも連続させます。commentはblock上部のsection headingとして、同じ20 px gridに揃えます。box textの言い換えではなく、意図、制約、または理由を説明してください。

processing step間は縦に40 px以上、主要lane間は80 px以上空けます。複数inletへのfan-inには追加のspaceを確保します。繰り返し構造を揃え、object boxを重ねないでください。

## Cordとrouting

短く直接的なpatch cordと、安定したoutlet-to-inlet順序を優先します。交差を完全には避けられない場合もありますが、繰り返し交差する場合は、lane、object順序、module境界を見直してください。不明瞭なlayoutをきれいに見せるためにcordを隠してはいけません。

見える長距離cordがarchitectureを見えにくくする場合、または名前付きmodule-level routingの方が明確な場合に `send`/`receive` を使用します。名前はdomain上の意味を表し、衝突の可能性がある場合はscopeを限定します。局所的に読みやすいconnectionを、意味のないwireless routingへ置き換えないでください。

## Moduleの選択

- **subpatcher** は、親patchだけに属し、inlineで保存することに意味がある実装詳細を畳み込む場合に使用します。
- **abstraction** は、明確なinlet/outlet contractを持つ、再利用可能または独立してtest可能なunitに使用します。
- **bpatcher** は、再利用可能なpatchが、埋め込み表示するUI surfaceも所有する場合に使用します。

まとまりのあるblockが約12〜15 objectを超える、複数の交差がある、またはlayoutより名前で明確に表現できる場合は、moduleへの抽出を検討してください。

## UIとPresentation Mode

Patching Modeはengineering diagramです。Presentation Modeはoperator interfaceです。まず安定したsignal/control architectureを作り、その後、必要なcontrolとfeedbackだけをPresentation Modeへ公開します。純粋に装飾的なUIをpatching flowへ置かず、実行内容の説明をpresentation座標に依存させないでください。

色はgroupやstateの補助に使用できますが、label、alignment、whitespace、topologyだけでも意味が分からなければなりません。可能な限りstandard UI componentを使用し、automationまたはscriptingが参照するcontrolにはsemanticな `varname` を付けてください。

## Debugging

一時的な `print`、meter、probe、test-message objectは、調査対象の境界付近に配置し、自明でないprobeにはlabelを付けます。納品前に削除してください。診断機能を意図して残す場合は、名前付きsectionまたはmoduleへ分離し、通常時のtimingやsignal flowを変更しないようにします。
