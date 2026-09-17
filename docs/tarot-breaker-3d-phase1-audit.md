# TAROT BREAKER 3Dワールド — Phase 1 監査レポート

| 項目 | 値 |
| --- | --- |
| 監査日 | 2026-09-11（UTC） |
| 対象 | `reverse-shion/reverse-shion.github.io` |
| 指定ブランチ | `docs/tarot-breaker-3d-spec-v0.3` |
| 監査基準コミット | `1c1a7a68516c74972d7ce481f07be29dea02cd32` |
| 監査専用ブランチ | `feature/tarot-breaker-3d-phase1-audit` |

最上位仕様は [tarot-breaker-3d-spec-v0.3.md](tarot-breaker-3d-spec-v0.3.md)。その後に [astra-phase-1-execution.md](astra-phase-1-execution.md) を読み、本書の作成だけを実行した。ルートの `AGENTS.md` も確認した。

本書の「確認済み」は、指定コミットのコード・データ・ファイル実体、または明記したGitHubの実行記録に基づく。「推奨」「CONFIG」「TODO」は設計判断であり、実装済み機能や新しい公式設定を意味しない。iPhone／iPad実機での操作・音声・描画性能の検証は行っていない。

## 1. Executive Summary

**Phase 1完了。Phase 2判定は GO WITH CONDITIONS。**

`/tarot-breaker/starworld/` は未使用で、既存の静的サイトへ独立したページとして追加する設計は可能。既存ページのCSS／JSを一括で取り込まず、新ページ内に責務を閉じることを推奨する。ただし、同一オリジンのService Workerと保存領域はディレクトリ分離だけでは隔離されない。

主な確認結果：

- スキットはmanifest登録31本・301ノード。全JSONを解析し、開始ノードと遷移先の存在を確認した。エンジンには指定JSONの開始と終了コールバックがある。
- 表情画像の参照53パスのうち、25パスが不存在、4ファイルが0バイト。影響は8本。残る23本は参照先の存在・非空・画像デコードを確認したが、再生体験の合格を意味しない。
- リュミエールの間は独立HTMLとして再利用できる。3Dへ戻る専用導線、入退室通知、音声の所有権切替APIはない。
- `assets/shiopon_transparent.png` は実体がJPEG・RGBで、背景の市松模様が焼き込まれている。無加工の透過全身Billboardには使えない。
- 本番の実行記録で `main` のリポジトリルートをGitHub Pagesへ公開していることを確認した。

監査時のmainは `a7c8624edb258ddb8c71696fbdd7f487c8061e00`。指定コミットとの全ファイル比較では、差分は仕様書2本の追加だけで、既存HTML／CSS／JS／JSON／画像／音源は一致していた。したがって本書の既存資産に関する所見は、このmainスナップショットにも該当する。

今回の変更は本レポート1ファイルの追加のみ。Three.js導入、ゲーム用ディレクトリ作成、3Dコード、既存機能の修正、mainへのマージ、公開は実施していない。

## 2. Existing Asset Inventory

パスはリポジトリルート基準。「変更必要性」は将来の再利用時に必要となる作業を示し、今回の変更を指示するものではない。

| path | 内容 | 現在の用途 | 3Dでの再利用方法 | 変更必要性 | リスク |
| --- | --- | --- | --- | --- | --- |
| `js/skitEngine.js` | 単一のスキットエンジン | JSON読込、会話、分岐、表情、終了演出 | 既存APIを薄いBridgeから呼ぶ | 本体変更不要。接続処理はPhase 5 | Medium |
| `js/shiopon-skit-loader.js` | オーバーレイ・ランダム選択・フォーカス管理 | `star-memory.html`、`starting-town.html`等 | 既存DOM・終了処理の参照元 | 公開APIに場所別ID指定がない。丸ごと流用しない | Medium |
| `css/shiopon-skit.css` | 既存スキットUI | 3人の立ち絵と会話枠 | 同じUIにそのまま適用 | 既存CSSは維持。新ホスト内の高さ・操作制御を後で検証 | Medium |
| `skits/manifest.json` | 31本の一覧 | ランダム再生候補 | IDから既存URLを参照 | 書換え不要。採用対象を新側のCONFIGで限定 | Medium |
| `skits/skit_001.json` ～ `skit_031.json` | 301ノードの既存会話 | スキット本文・分岐 | 原文のまま呼び出す | 本文変更不要。8本に画像参照問題 | High |
| `skits/assets_manifest.json`、`ASSETS_README.md`、`assets_checklist.md` | 初期素材リスト・説明 | 素材準備資料 | 補助資料 | manifestの24パスだけでは全31本を検証できない | Medium |
| `assets/skit/shion/` | 表情8ファイル | スキット | 既存UIで表示 | そのまま再利用 | Low |
| `assets/skit/lumiere/` | 表情11ファイル | スキット | 既存UIで表示 | 不足する別名画像を存在済みと扱わない | Medium |
| `assets/skit/shiopon/` | 12ファイル、うち4つ空 | スキット | 有効な8素材を既存UIで表示 | 0バイト素材は使用不可 | High |
| `assets/skit/family.png` | 3人のランチャー画像 | `svTalkBtn` | 既存UIに保持 | キャラ個別の3D素材にはしない | Low |
| `lumiere-gate.html` | リュミエールの間一式 | 入室、名前、会話、目ぱち、口パク、音楽 | ページ全体を維持して接続 | 戻り方と音の切替をPhase 6で設計 | High |
| `assets/lumiere/` | 顔・目・口・shyの8素材 | ルーム内レイヤー | 既存ルームに任せる | 再制作不要。表情別の一部参照は欠損 | Medium |
| `img/lumiere-full.png` | 実体JPEG、832×1248 | ルーム全身表示 | 既存ルームのまま使用 | 透過3D素材と誤認しない | Medium |
| `data/lumiere-lines.txt`、`js/common.js` | 会話TXT・共通の閲覧者名 | ルームの会話と名乗り | 既存ルームが引き続き使用 | 3Dの主人公名で保存名を上書きしない | Medium |
| `assets/shiopon_transparent.png` | 全身絵、実体JPEG、683×689 | `shion.html`等のアバター | デザイン参照 | 真の透過原本の確認が必要 | High |
| `img/characters/shiopon.webp` | 背景付きバストアップ | TAROT BREAKER人物紹介 | デザイン・配色参照 | 全身Billboardへの直使用不可 | Medium |
| `assets/shiopon/bust/` | 1024×1024の16レイヤー | しおぽんの会話パネル | 既存2D表示を維持 | 体・目・口・耳等の合成が必要。全身ではない | Medium |
| `assets/shiopon/toggle/` | 800×800の10レイヤー | 呼び出しボタン | 既存2D表示を維持 | キャラ全身素材に流用しない | Low |
| `assets/shiopon/mini/` | 影と空に近いTXTのみ | 未完成のmini枠 | 今回のNPC素材候補から外す | 完成したmini本体を確認できない | Medium |
| `js/shiopon-visual.js`、`js/shiopon-core.js`、`js/shiopon-bootstrap.js`、`css/shiopon-companion.css` | レイヤー・台詞・DOM注入 | 既存しおぽんパネル | 既存ページ側で維持 | ゲームへの自動注入は避ける | Medium |
| `assets/shiopon/shiopon_lines.txt` | 既存しおぽん台詞 | Companion Coreから読込 | 必要時に既存コンテンツとして参照 | 既存CoreのURLは文書相対 | Medium |
| `img/world/`、`img/*town.png`等 | 世界観・街・回廊の画像 | 背景、装飾、一部未参照 | §6の分類に従う | 加工なしで万能3Dテクスチャにはならない | Medium |
| `audio/seifu-raguna.mp3` | 星封ラグナ | ルーム、物語ガイド | 既存音楽ボタン・音源を維持 | 他の再生元と同時に鳴らさない | High |
| `tarot-breaker/index.html`、`css/tb-*.css`、`js/tb-*.js` | 現行ポータル | 案内・演出・Pameraカード | 入口は将来必要な時に接続 | Phase 1では変更なし。ページ全体の埋込みはしない | Medium |
| `tarot-breaker/world/starworld.html` | 星界の説明ページ | 既存の案内先 | そのまま残す | 新候補URLとは別物 | Low |
| `tarot-breaker/data/arcana.json`、`js/tb-summon.js`、`img/pamera/cards/`（後二者は`tarot-breaker/`配下） | 既存Arcana名・Pamera名 | 説明・カード公開 | 将来の命名衝突確認のみ | 22経路への自動対応付け禁止 | Medium |
| `sw.js`、`manifest.webmanifest` | 共通キャッシュ・PWA設定 | `shion.html`からSW登録 | ゲーム側へ新規登録を持ち込まない | 同一オリジンの影響確認が必要 | High |
| `assets/css/common.css`、`assets/js/common.js` | 全体スタイル・ヘッダー | ポータル等 | ゲームには一括読込しない | body余白やcanvasのCSS競合を避ける | Medium |

## 3. Skit Integration Findings

**再利用可。ただし「既存ランダムボタンを押すだけ」では場所別スキットにならない。**

確認した接続点は `window.SV_SkitEngine.start` の `rootEl`、`skitUrl`、`userName`、`returnMode`、`onReturn`、`onNext` と、`stop()`。描画・分岐・表情はエンジン本体にある。画像URLはキャラクター名を小文字にし、表情名の空白をハイフンへ変換した `/assets/skit/<character>/<expression>.png` に固定される。

現行DOMは `#sv-skit` の下に `.sv-overlay`、`.sv-overlay-panel`（dialog）、`.sv-overlay-body`、`.sv-engine-root` があり、その中へエンジンが `.sv-shell`・3つのslot・会話・選択肢を生成する。CSSの多くはこのID／クラス構造に依存する。現行CSSはオーバーレイのヘッダーや上部操作を非表示にするため、閉じるボタンの処理があることと、常にそのボタンが見えることは別である。

現行起動方法は `#svTalkBtn` のクリック、`window.ShioponSkit.open()`、`sv:skit:open`。ローダーがmanifestから未再生優先のランダム選択を行う。これらの公開入口は `skitId`／`skitUrl` を受け取らない。

終了は次のように区別する必要がある。

| 契機 | 現行の処理 | 将来Bridgeに必要な扱い |
| --- | --- | --- |
| 「またね」 | 送別演出後、`returnToPage()` → `stop()` → `onReturn` | 元の位置・視線へ復帰 |
| 最後のノード | Auto停止と「まだ一緒にいる」表示。自動退出しない | 終端到達と退出を同一視しない |
| 「まだ一緒にいる」 | `onNext`、なければ `sv:skit:next` | 場所に許可された次話／退出方針をCONFIG化 |
| 背景タップ・閉じる・Escape | ローダーの `close()` → stop、非表示、フォーカス復帰 | エンジンのonReturnだけに依存せず、全終了経路を統一 |
| `sv:skit:close` | 外から閉じるための入力イベント | 「閉じ終わった通知」として購読しない |
| 読込失敗／読込中に閉じる | エラー表示。fetchの中止・世代管理はない | 失敗時の退出と遅延完了後の再表示をBridge側で扱う |

Phase 5の推奨は、エンジンと既存CSS・会話UIを維持し、現在のホスト構造に合わせた薄いBridgeからJSONを指定する方式。ランダムローダー、Companion全体、ゲームの入力を同時に起動しない。ゲームの位置・視線をメモリに保持し、入力解除・フォーカス・全終了経路の後始末だけを接続側で担う。**今回はBridgeを作成していない。**

データ照合結果：

| 対象JSON | ノード数 | 画像参照結果 |
| --- | ---: | --- |
| `skit_001` | 8 | 0バイト4種 |
| `skit_002` / `003` / `004` | 11 / 13 / 9 | 参照先確認済み |
| `skit_005` / `006` / `007` / `008` | 8 / 8 / 9 / 10 | 参照先確認済み |
| `skit_009` / `010` / `011` / `012` | 10 / 9 / 9 / 8 | 参照先確認済み |
| `skit_013` / `014` | 8 / 10 | 参照先確認済み |
| `skit_015` | 11 | リュミエール3種不足 |
| `skit_016` | 8 | 参照先確認済み |
| `skit_017` / `018` | 9 / 10 | しおぽんpatient不足 |
| `skit_019` / `020` / `021` / `022` | 9 / 8 / 13 / 11 | 参照先確認済み |
| `skit_023` | 12 | しおぽんcurious不足 |
| `skit_024` / `025` / `026` / `027` | 9 / 12 / 13 / 9 | 参照先確認済み |
| `skit_028` | 10 | リュミエールthinking・しおぽんcurious不足 |
| `skit_029` | 9 | 参照先確認済み |
| `skit_030` | 9 | 14種不足 |
| `skit_031` | 9 | 12種不足 |

欠損の実体（すべて `assets/skit/` 配下）：

| 状態 | キャラクター | ファイル名 |
| --- | --- | --- |
| 0バイト | shiopon | `bouncy.png`、`pouting.png`、`radiant.png`、`sparkling-eyes.png` |
| 不存在 | shion | `calm.png`、`soft-smile.png` |
| 不存在 | lumiere | `surprised.png`、`sad.png`、`unsure.png`、`thinking.png`、`confused.png`、`serious.png`、`calm.png`、`peaceful.png`、`observing.png`、`soft.png` |
| 不存在 | shiopon | `patient.png`、`curious.png`、`panicked.png`、`worried.png`、`nervous.png`、`apologetic.png`、`relieved.png`、`listening.png`、`serious.png`、`bright-smile.png`、`wonder.png`、`quiet.png`、`quiet-smile.png` |

エンジンに欠損表情を別の表情へ自動変換する対応表はない。画像読込エラー時は既存像が残る／表示されない可能性があり、ファイル名だけで再生可能と判定しない。

将来の最初の候補は `skit_005`（静かな夜）、`skit_007`（散歩）、`skit_008`（星を見る）。原文と画像参照を確認済み。ただし `007`／`008` の「星界」や既存の星座名を、1000年前のどの場所・共鳴状態として扱うかはCONFIGで選定する。本文の修正や新しい公式位置付けは行わない。

## 4. Lumière Room Findings

**既存ページ全体の再利用が適切。会話・目ぱち・口パク・音楽の再制作は不要。**

- URLは `/lumiere-gate.html`。ページ内の `sceneFoyer` と `sceneHall` が切り替わる。保存名があればホールへ入り、なければ名前入力を含む入口を経る。
- 基本画像は `img/lumiere-full.png`、`assets/lumiere/face.png`、目3種、口3種、`shy.png`。8レイヤー画像の実体をデコード確認した。
- 目ぱちは `blinkMin=3000`／`blinkMax=7000` を使うタイマー。口パクは文字送り・文章量に応じたエネルギーとintervalによる3状態表示。音声解析によるリップシンクではない。
- `data/lumiere-lines.txt` を読み込む。表情にはdefault／gentle／smile／sad／serious／shyがあるが、smile等の専用目・口の一部は存在せず、通常画像へのfallbackが設定されている。smile用6画像のpreload参照も未充足。新接続の不具合と混同しない。
- 音楽ボタン `#soundToggle` のclickが `toggleBgm()` を呼ぶ。再生Promiseの失敗表示、再入防止、play／pauseに連動するUI更新がある。
- 現在の戻り先は公式トップ `/` と作品案内 `tarot-breaker/`。物語外部URL、`star-memory.html`、会話後の `serephias-chamber.html` への移動もある。3Dへの `returnUrl` 処理、退出イベント、postMessage契約はない。
- ルームのJSはIIFEと固定DOMに閉じており、公開の入退室APIはない。HTMLの移植や新URLへのコピーは文書相対の画像・音源・TXTを壊す。

Phase 6の設計候補は、**元URLを読み込む同一オリジンの独立iframeをゲーム側のRoom Bridgeで管理する方式**。これは既存ページを改造せず、親側に庭園へ戻る操作を置き、位置・視線を保持しやすいための設計判断である。入室前にゲーム側の音をフェード後停止し、退出時はiframe内のaudioを明示停止してiframeを破棄する。CSSで隠すだけでは音・タイマーが残る。単なる別タブ起動は音の重複と復帰状態を管理しにくい。

iframe可否は本番のCSP／X-Frame-Optionsヘッダーを取得できていないため未確定。ルーム内リンクで別ページへ進んだ場合、外部遷移、読込失敗、戻る操作も含めた退出経路をPhase 6前に確認する。位置復帰をブラウザのbfcacheだけに依存させない。

既存ルームは「閲覧者への案内」であり、1000年前のシオン本人として入室する契約はない。保存されている閲覧者名を「シオン」へ書き換えず、既存ルームをどの物語上の接続として見せるかは `CONFIG-ROOM-ERA` とする。

## 5. Shiopon Asset Findings

| 候補 | 実体・寸法 | 視覚確認 | 判定 |
| --- | --- | --- | --- |
| `assets/shiopon_transparent.png` | JPEG／RGB、683×689、121,776 bytes | 全身はあるが、市松模様と発光背景が焼込み | 無加工の透過Billboardには不可 |
| `img/characters/shiopon.webp` | WebP／RGB、1536×1024、71,610 bytes | 背景付きバストアップ | キャラ参照用 |
| `assets/shiopon/bust/body_base.png` | PNG／RGBA、1024×1024 | 実際のalphaあり。目・口・耳を別レイヤーで載せる体素材 | 既存2Dパネル用。単体・全身NPCとして不可 |
| `assets/shiopon/toggle/toggle_base.png` | PNG／RGBA、800×800 | 実際のalphaあり。分割レイヤーの基底 | 呼び出しUI用 |
| `assets/skit/shiopon/` | 有効8画像は512／1024角、ほか4つ空 | 既存表情セット | スキットで使用。全身素材扱いしない |

bustは16レイヤー計1,130,385 bytes、toggleは10レイヤー計810,013 bytes。既存Visualが影・耳・体・目・口を合成し、Coreが台詞と状態を管理、BootstrapがDOMを注入する。旧 `assets/js/shiopon.js`、`js/shiopon-companion.js` も存在するが、同時に新ゲームへ読み込まない。

`js/shiopon-core.js` の台詞URL `assets/shiopon/shiopon_lines.txt` は文書相対のため、新候補URLからそのまま起動すると異なるパスを要求する。一方、Visualの素材URLはルート相対。素材再利用と旧パネル全体の移植は分けて判断する。

**TODO-SHIOPON-ALPHA：無加工で利用できる正規の透過全身原本を確認する。** 存在しない部分を新デザインや自動生成で補完しない。これはPhase 5の素材条件であり、人物の配置を行わないPhase 2の開始を妨げない。Phase 1では画像加工・合成・配置を行っていない。

## 6. World / Visual Asset Findings

分類：**1**＝そのまま3Dテクスチャ等へ使用可能、**2**＝固定視点の遠景／背景カードとして条件付き使用可能、**3**＝コンセプト参照、**4**＝今回の用途に使用非推奨。既存ページからの削除や、画像の品質そのものの評価ではない。

下記画像は実体の形式・寸法と原画像を確認した。`.png` 名でも実体JPEGのものがある。

| path | 実体・寸法 | 現在の用途・内容 | 分類 | 再利用条件／理由 |
| --- | --- | --- | ---: | --- |
| `img/world/starworld-main.webp` | WebP 1536×1024 | 保管素材。現行HTML／CSS／JSに直接参照なし。門・星空・タイトル入り | 3 | 門、円環、結晶の参考。文字と強い発光を空全面へ焼き込まない |
| `img/world/tb-about-world.webp` | WebP 1024×1536 | 保管素材。直接参照なし。宇宙・結晶・カード | 3 | 色と象徴の参考。全天球やタイル素材ではない |
| `img/world/tb-seikai-gate.webp` | WebP 3072×3072 | `tb-animations.css`の装飾参照。白背景の金色の紋章 | 3 | 建造物としての門ではない。alphaがなく、そのまま透過紋章にはならない |
| `img/morning-town.png` | JPEG 1024×1024 | `starting-town.html`朝背景 | 3 | 曲道・高低差・結晶の参考。欧風の街を星門庭園の確定建築にしない |
| `img/daytown.png` | JPEG 1024×1024 | 同・昼背景 | 3 | 同上。時刻変更画像はEra Stateとは別概念 |
| `img/eveningtown.png` | JPEG 1024×1024 | 同・夕背景 | 3 | 夕光の参考。v0.3の初期夜空を置き換えない |
| `img/nighttown.png` | JPEG 1024×1024 | 同・夜背景 | 3 | 静かな結晶光の参考。地球的な建築・植生をそのまま標準化しない |
| `img/life-spring-gate.png` | JPEG 1024×1024 | `life-spring.html`背景。水鏡・崩れた回廊 | 3 | 水と円環の参考。廃墟を1000年前の美しい庭園と確定しない |
| `img/library.png` | JPEG 784×1168 | `library.html`背景。光る書架 | 2 | 固定視点の奥景に限る。回り込める書架／壁テクスチャにはならない |
| `img/foyer-lumiere.jpg` | JPEG 1024×1024 | 既存ルームの入口背景 | 2 | 元ルームでそのまま保持。遠い入口の背景候補は視点・印の写込みを要確認 |
| `img/lumiere-hall.jpg` | JPEG 832×1248 | 既存ルーム、物語ガイド背景 | 2 | 人物も焼き込まれている。既存ルーム背景として保持し、無人の建築素材にはしない |
| `img/tunnel.png` | JPEG 784×1168 | `cosmic-resonance-tunnel.html`背景 | 3 | 共鳴円環の参考。初期庭園の全天球には不適 |
| `img/distortion.png` | JPEG 784×1168 | `distortion.html`背景 | 4 | 激しい崩壊・歪み表現は静かなpast_1000の初期景観には不適 |
| `tarot-breaker/img/tb-top-main-visual.webp` | WebP 1024×1536 | 現行ポータルの主画像・OG | 4 | 人物・武器・カード・タイトルを含む宣伝絵。初期空間の背景にしない |
| `img/hero/tb-main-visual.webp` | WebP 1024×1536 | 保管された人物主体の主画像 | 3 | 衣装・配色の参照。王宮や庭園の資料ではない |
| `aster-memory-bg.png` | ファイル不存在 | `star-memory.html`が参照 | 4 | 現状では読込不可。勝手に代替画像を決めない |

今回の世界画像から、分類1の「そのまま使える床・壁の反復材質／全天球／透過遠景」は確認できなかった。2Dイラストは視差・裏面・照明が固定されている。独立した王宮モデル、庭園地形、星灯花・月雫草・星脈樹・夢灯苔の専用3D素材も未確認。リポジトリにglTF／GLB／FBX／OBJ／Blend／KTX2は見つからない。

`tb-seikai-gate.webp` は圧縮時約208 KiBでも、RGBA展開を仮定すると3072×3072×4＝36 MiB、mipmap込み概算48 MiBになる。通信サイズだけでiPhoneの描画負荷を判断しない。巨大画像の無条件ロードや全表情の一括GPU化は避ける設計が必要。

## 7. Audio Findings

ファイルの形式・時間はffprobeで確認し、用途は参照ページとJSを照合した。全曲の聴取、iOSでの再生・ループ継ぎ目・フェードの実測は行っていない。

| path | 実体／時間／サイズ | 使用ページ・再生方式 | loop | 操作後再生 | 同時再生上の注意 |
| --- | --- | --- | --- | --- | --- |
| `audio/seifu-raguna.mp3` | MP3 48kHz stereo／253.104秒／5,738,358 B | `lumiere-gate.html`の音楽ボタン、`tarot-breaker/story/guide.html`の音ボタン。preload=metadata | あり | clickからplay、失敗表示あり | 各ページが独立audioを持つ。iframe併存時は所有者を1つにする |
| `music/tracks/love-theme.mp3` | 上記と同一バイト列 | `love/index.html`・`love/js/app.js`・`music/index.json` | 恋愛ページ側の管理 | 本件では再生動作未監査 | 同名／異名で別曲と判断して追加ロードしない。恋愛ページの監査は範囲外 |
| `assets/sound/reverse-init.mp3` | MP3 48kHz stereo／15.648秒／500,736 B | `serephias-gate.html`・`serephias-gate.js`の祈り操作とフェード、`shion.html`の演出 | gateではあり | gateの操作から開始 | 別演出の音を庭園BGMへ自動転用しない |
| `assets/sound/temple-ambient.mp3` | 上記と同一バイト列 | ソース内の再生参照なし | 定義なし | 再生元なし | ファイル名だけで環境音の種類を決めない |
| `stardust-reverie.mp3` | MP3＋埋込画像／331.872秒／7,974,555 B | `oracle.html`・`oracle.js`の音ボタン | なし | clickからplay／pause | iframe併存なら個別停止が必要 |
| `gate-bgm.mp3` | MP3＋埋込画像／212.784秒／4,667,328 B | gate2は実際には不存在の `assets/gate-bgm.mp3` を参照 | gate2ではなし | `serephias-gate2.js`に操作からplay／フェード | ルートのファイルを自動補正・採用しない |
| `audio/music.mp3`、`music.mp3` | MP4系コンテナ、H.264＋AAC／80.200秒／各2,713,935 B、相互に同一 | この監査で再生参照を特定できず | 定義なし | 再生元未特定 | 拡張子はMP3だが音声専用MP3ではない |
| `di/audio/music.mp3` | MP3＋埋込画像／80.040秒／3,217,158 B | `di/di.html`のプレイヤー | 別コンテンツの管理 | 本件では未監査 | `audio/music.mp3`とは別資産。庭園へ自動転用しない |

星封ラグナのルーム内設定値はvolume=0.68、物語ガイドは0.56。数値の存在と実機上の音量・フェード動作は別である。既存の再生失敗処理を維持し、復帰時も再生Promiseの拒否を扱う。ユーザー操作と離れた非同期処理からの再生は成功を前提にしない。[WebKitのユーザー操作とメディア再生に関する説明](https://webkit.org/blog/6784/new-video-policies-for-ios/)

3D側の新BGM・環境音は追加していない。Phase 6では「庭園」「ルーム」「停止」のうち1つが音を所有し、非表示・退出・ページ離脱時の停止を契約化する。フェードのタイマーだけで停止完了を代用しない。

## 8. GitHub Pages / Routing Findings

**現在の公開方式はmain／リポジトリルートの静的配信と確認できた。**

監査時の最新成功実行は [pages build and deployment #34586935241](https://github.com/reverse-shion/reverse-shion.github.io/actions/runs/34586935241)。buildジョブ `103223213483` のログはcheckoutの `ref: main` とupload-pages-artifactの `path: .` を示す。build手順はCheckout→Upload artifactで、リポジトリ内のビルド処理を実行していない。ルートに `.nojekyll` があり、`.github/`、`_config.yml`、`package.json`、CNAMEはない。

設定画面そのものは未取得だが、実際に何を公開したかは実行記録で確認できている。GitHub Pagesは、特定ブランチのルートまたはdocsを公開元にできる。[GitHub Pages公式説明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

| 項目 | 確認結果 |
| --- | --- |
| default branch | `main` |
| 現行ポータル | `/tarot-breaker/` → `tarot-breaker/index.html` |
| 現行星界説明 | `/tarot-breaker/world/starworld.html` |
| 現行ルーム | `/lumiere-gate.html` |
| 候補 | `/tarot-breaker/starworld/` はディレクトリも参照も未存在 |
| ルーティング | 通常のHTMLリンクとlocation遷移。候補パスを奪うSPAルーター・rewrite設定は未検出 |
| 直接アクセス | 将来同パスにindex.htmlを追加し公開元へ反映すれば静的URLとして成立する設計。現時点のHTTP応答は未検証 |
| PRプレビュー | featureブランチ作成だけでは本番URLに出ない。専用PRプレビュー設定は未確認 |
| module | `di/di.html`にtype=module、`di/js/main.js`に相対importとimport.meta.urlが既に存在 |
| import map／Three.js | 実装ファイル内にimport map、Three.js、WebGL／WebGL2の利用を検出せず。Canvasは2D用途 |
| 共通依存 | ポータルにGoogle Fonts。スキットの本体・CSS・JSON・画像は同一オリジン |
| CSP | 対象HTMLのmeta CSPなし。配信レスポンスのCSP／X-Frame-Options／Content-Typeは未取得 |
| PWA | ルートmanifestあり。start_urlとscopeは `/`、orientationはportrait |

候補ページを `/tarot-breaker/starworld/index.html` とした場合の正しい参照：

| 既存資産 | 推奨URL（ルート相対） | 同ページからの文書相対表現 |
| --- | --- | --- |
| スキットエンジン | `/js/skitEngine.js` | `../../js/skitEngine.js` |
| スキットCSS | `/css/shiopon-skit.css` | `../../css/shiopon-skit.css` |
| manifest | `/skits/manifest.json` | `../../skits/manifest.json` |
| 既存会話JSON例 | `/skits/skit_005.json` | `../../skits/skit_005.json` |
| しおぽん素材例 | `/assets/shiopon_transparent.png` | `../../assets/shiopon_transparent.png` |
| 世界画像例 | `/img/world/starworld-main.webp` | `../../img/world/starworld-main.webp` |
| ルーム | `/lumiere-gate.html` | `../../lumiere-gate.html` |
| 星封ラグナ | `/audio/seifu-raguna.mp3` | `../../audio/seifu-raguna.mp3` |
| 現行ポータル | `/tarot-breaker/` | `../` |

この相対表はHTML文書基準であり、外部CSSのurlはCSSファイル、ESMのimportはモジュールURL基準。JSON中のURLは自動でJSONファイル基準になるとは限らない。新データの基準をCONFIGとして明記する。既存ルームを元URLのまま読み込めば、その文書相対参照を維持できる。候補パスを変更する必要はない。

### Service Workerの具体的な注意

登録箇所は `shion.html` の `navigator.serviceWorker.register('/sw.js')`。通常のscopeはルートであるため、過去の訪問で制御を受けるブラウザでは新ディレクトリにも影響しうる。

`sw.js` はinstall／activate／fetchがそれぞれ2組ある。

- `revshion-v1` と `rs-v1` のactivate処理が、それぞれ自分以外のキャッシュを削除する。新ゲーム用キャッシュの追加も巻き込まれうる。
- 先に登録されたfetch処理が拡張子一致の画像・MP3等をキャッシュ優先で扱うため、後段の「音声・動画は素通し」という意図は該当URLには適用されない。複数fetchリスナーは最初にrespondWithが呼ばれるまで登録順に実行される。[MDNのfetchイベント説明](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/fetch_event)
- 後段はscript／styleをキャッシュ優先で扱う。新HTMLと古いJSの組合せを防ぐには、入口だけでなく内部importを含むバージョン管理が必要。
- preloadリスト9項目中、`/assets/hero-poster.jpg`、`/assets/favicon.png`、`/assets/favicon.svg`、`/assets/icon-180.png`、`/assets/icon-192.png`、`/assets/icon-512.png` の6ファイルがリポジトリにない。これらが404ならaddAllが失敗し、新規installが成立しない可能性がある。

これは静的に確認したリスクであり、「全ユーザーで現在SWが有効」とは断定しない。各端末に残る登録・旧キャッシュ・更新状態は未測定。Phase 2のローカル試作を開始できても、本番相当の同一オリジン検証を飛ばして公開可とは判断できない。Phase 1ではSWの修正・登録解除・キャッシュ削除を行っていない。

## 9. Mobile / iOS Findings

| 観点 | 現在の証拠 | Phase 2以降で必要な対策・確認 |
| --- | --- | --- |
| viewport／Safe Area | ポータルとルームにviewport-fit=cover。ルームは四辺のenvと100dvh。旧探索ページにはcoverなし | 新ゲームページ自身でSafe Areaを扱う。親ページの対応を継承できると考えない |
| 高さ | ポータルheroはsvh／dvh対応。スキットCSSには92vhと上書き規則が複数。旧探索ページには100vh | アドレスバー伸縮、キーボード、縦横回転で入力領域が欠けないことを検証 |
| 二本指の操作 | 現行はクリック・タッチのUI中心。tb-parallaxにはtouchmove／deviceorientation、tb-summonにはpointerup | 左右のpointerIdを分離し、pointercancel／lost capture／blurで移動を解除 |
| スクロール競合 | スキットはbodyのoverflowをロック。各ページにはscroll監視。スキットボタンはtouch-action:manipulation | ゲーム操作面にだけtouch-actionを限定。会話・ボタンの通常操作を維持 |
| orientation | manifestはportrait。既存コードの一部はorientationchange対応 | 通常Safariタブとホーム画面起動を分けて縦横確認。新ページから端末回転を強制しない |
| 音声 | ルームは明示clickとplayの失敗処理あり | 遅延ロード後・iframe内・復帰後の再生を実機確認。音楽ボタンを保持 |
| CSSの波及 | tb-coreはhtml／body／canvas等の汎用セレクタ。common.jsはbody.paddingTopを書換え | 新ゲームに既存ページ一式を読込まない。スキットCSSだけを限定的に接続 |
| 入力・モーダル | エンジンのキー処理はpanel、ローダーはdocumentにもEscapeを登録 | ゲーム入力の停止、押しっぱなし解除、フォーカスの復帰を一元化 |
| 復帰・メモリ | 既存ルームにpagehide／pageshow／visibilitychangeで音を統括する処理なし | タブ切替・中断・WebGL context lossの回復方針、DPR上限、非表示時停止を検証 |
| 保存制限 | ローダーはlocal→session→memoryにfallback。一方Engine.startと共通名取得の一部はlocalStorage直読 | 保存不可でも会話や試作を停止させない。主人公の状態と閲覧者名を分離 |

iPhone／iPad Safariの動作保証、30～60fps、低性能端末のメモリ余裕は現時点では未検証。Phase 1の完了条件を、未実装3Dの性能合格と混同しない。

## 10. Risk Matrix

評価は、対策を施さず将来3Dを接続した場合の影響度。Highがあっても、その機能を含まないローカルgrayboxの可否とは分けて判断する。

| ID | 対象 | 評価 | 具体的なリスク | 対処する段階 |
| --- | --- | --- | --- | --- |
| R1 | キャッシュ／既存ページ | High | ルートSW、相互キャッシュ削除、古いJS、precache欠損 | Phase 2本番相当検証前 |
| R2 | スキット／素材 | High | 25画像不存在＋4空、8本に影響。ランダム起動には場所指定なし | Phase 5前に採用JSONを限定し再生確認 |
| R3 | ルーム／音源 | High | 戻る契約・音の所有権がない。隠したiframeで音が残る可能性 | Phase 6前 |
| R4 | しおぽんの見た目 | High | 透過名の画像が非透過。低品質な代用品を置く危険 | Phase 5前に正規原本を確認 |
| R5 | 既存ページ表示／CSS | Medium | body余白、canvas汎用規則、全画面UIの競合 | Phase 2で独立HTML／CSS |
| R6 | JSグローバル／操作 | Medium | SV_SkitEngine等のsingleton、CompanionのDOM注入と入力干渉 | Phase 2で隔離、Phase 5でBridge |
| R7 | モバイル | High | 左右タッチ、vh、Safe Area、音声、実機性能が未検証 | Phase 2受入と各接続Phase |
| R8 | 読込速度 | Medium | 27有効表情だけで約17.1 MiB、ルーム顔1枚約3.81 MiB、BGM約5.47 MiB | 使用時ロード。初期に全資産を読まない |
| R9 | ナビゲーション | Medium | 新ページへの入口・既存ルームからの帰路が未契約 | 入口公開前／Phase 6前 |
| R10 | Pages公開／URL | Low | 候補ディレクトリは未使用。公開元はroot。ただしfeature branchは本番未反映 | ブランチと公開を分離 |
| R11 | 設定・命名 | Medium | Arcanaの既存5件と将来22経路の誤対応、ルームの閲覧者とシオンの混同 | CONFIG／TODOとして保持 |
| R12 | 保存領域 | Medium | sv_user_nameや既存既読キーを上書きする危険 | 将来の保存導入時。Phase 2では増設しない |

Phase 1自体の本番影響はLow。既存の実行ファイルは変更せず、公開ブランチにも触れない。

## 11. Recommended Phase 2 Architecture

**推奨方式は1つ：独立静的HTML＋ES Modules＋同一バージョンのThree.js配布ファイルを新ディレクトリ内へ同梱する方式。ビルド工程は追加しない。**

既存の `di/` に静的ES Modulesの構造があり、mainの公開はルートをそのまま配信している。既存ポータルは通常scriptとグローバルDOMを使うため、新ページを別文書にするのが安全と判断した。ローカルimport mapで依存を固定し、必要な配布ファイルと同一リリースの内部依存・ライセンスを揃える。採用バージョン、最低Safari、WebGL要件は `CONFIG-THREE-VERSION` としてPhase 2開始時に確定する。今回はライブラリの取得・導入はしていない。

CDN方式について、対象HTMLに禁止するmeta CSPは見つからないが、Google Fontsの利用だけでJavaScript CDN importの成功は証明できない。CORS、MIME、本番ヘッダー、利用端末からの到達性は未検証。既存サイトに同一ライブラリはなく、バージョン混在を避けやすい同梱方式を推奨する。同梱してもルートSWの問題は別途残る。

Phase 2の責務は、仮の1マップ・歩行・一人称カメラ・iPhone／iPad操作まで。以降の接続処理は実装しない。

| 責務 | Phase 2での最小対象 | 後続Phaseとの境界 |
| --- | --- | --- |
| app | 初期化、画面サイズ、停止・破棄の所有者 | ループを複数持たない |
| worldManager | 1つのBase World、仮地形、衝突、spawn、境界 | 実際の星空・植物・水は後続 |
| playerController | シオンの位置、歩行、衝突 | キャラ3Dモデルを要求しない |
| cameraController | 一人称の向き・感度・上下限 | 三人称・写真モードを実装しない |
| inputController | 左右のタッチ、PC入力、キャンセルと一時停止 | スキット／ルームの入力を抱え込まない |
| mapsの最小データ | mapId、spawn、境界、オブジェクトID | イベント・NPC・22経路を先に埋めない |

### 三層構造の責務とデータ案

以下はデータ項目の設計提案であり、JSONやManagerコードは作成していない。

| 層 | 所有するもの | 将来のデータ項目案 | 所有しないもの |
| --- | --- | --- | --- |
| Base World | 共通座標、地形、建築ID、接続点、衝突の基礎 | schemaVersion、mapId、objectId、transform、geometryRef、collider、anchorId | 時代ごとに複製した完成マップ |
| Era State | 時代による表示・破損・道・NPCの差分 | eraId、mapId、objectOverrides、availability、spawnOverrides | 共鳴の強さだけによる変化 |
| Resonance Layer | 想い・記憶・光・環境反応の差分 | resonanceStateId、mapId、anchorId、visualOverrides、eventRefs | Pameraの外見・公式設定の生成 |

初期識別子は仕様の `past_1000` を採用し、将来 `present` を追加できる境界を保つ。適用順はBase→Era差分→Resonance差分とし、層を切り替えるたびに前の差分が累積しない設計にする。Resonanceだけで通れる道を作る場合の衝突判定は明示的な契約が必要で、光の見た目から自動決定しない。

v0.3には説明例の `resonance_low/high` とManager例の `resonance_normal/active/memory/arcana` がある。別の公式状態を増やさず、`CONFIG-RESONANCE-ID` で技術上の正規名と別名の扱いを整理する。

既存資産との接続点は「既存skitIdとURL」「ルームの元URL」「既存素材パス」。Base／Era／Resonanceのデータへスキット本文やルームDOMを複製しない。イベントは安定したanchorIdを参照し、位置調整でIDや既読状態が壊れないようにする。

Pameraは初期NPCにしない。既存 `tarot-breaker/data/arcana.json` はversion 2、`arcana-01`～`arcana-05` の独自名5件であり、大アルカナ22経路の対応表ではない。一方 `tb-summon.js` の既存キーは `fool`、`magician`、`high-priestess`、`empress`、`emperor`。将来の `arcana_path_00`～`arcana_path_21` と数値順だけで結び付けない。対応は `TODO-ARCANA-MAPPING` とし、経路データ・覚醒・配置は今回もPhase 2も作らない。

保存について、AGENTS.mdの一般指針は保存機能を禁じ、ユーザーが最上位に指定したv0.3§65は将来のLocalStorageを明記している。本件ではv0.3の用途別方針を優先するが、Phase 1は保存機能追加なし、Phase 2の最小案もメモリだけで成立させる。将来必要になった時に既存キーと分離し、保存不可時も継続できるようにする。

## 12. Recommended Directory Structure

以下は**提案パス一覧**。ディレクトリもファイルも未作成。

| 提案パス | Phase 2の役割 |
| --- | --- |
| `tarot-breaker/starworld/index.html` | 独立入口、ゲーム用DOM、ローカル依存の宣言 |
| `tarot-breaker/starworld/css/starworld.css` | 新ページだけのレイアウト・操作・Safe Area |
| `tarot-breaker/starworld/js/app.js` | ライフサイクル統括 |
| `tarot-breaker/starworld/js/worldManager.js` | 共通の仮マップ |
| `tarot-breaker/starworld/js/playerController.js` | 歩行と衝突 |
| `tarot-breaker/starworld/js/cameraController.js` | 視線制御 |
| `tarot-breaker/starworld/js/inputController.js` | タッチ・PC入力、一時停止 |
| `tarot-breaker/starworld/data/maps.json` | 1マップの技術的な定義 |
| `tarot-breaker/starworld/vendor/three/<version>/` | バージョンを固定したESM配布ファイル・内部依存・ライセンス |

`skitBridge.js` はPhase 5、`roomBridge.js` と音の統括はPhase 6、Era／Resonanceの切替実装は必要な後続Phaseへ分離する。v0.3の長期ファイル案をPhase 2で全部生成しない。既存の `/assets/`、`/skits/`、`/audio/` は参照し、新ディレクトリへ複製しない。新しいService Workerも含めない。

## 13. Reuse / Do Not Rebuild List

| 必ず維持・再利用するもの | 作り直さないもの |
| --- | --- |
| 既存スキットエンジン、CSS、JSON、既存表情 | 別エンジン、改稿した会話、3D都合の大規模UI改修 |
| `lumiere-gate.html`とその元URL・依存資産 | 目ぱち、口パク、会話、音楽ボタンの再実装 |
| `audio/seifu-raguna.mp3`等の既存音源 | 同じ音のコピー、新曲での無断置換 |
| しおぽん・シオン・リュミエールの公式素材 | 低品質な3D代用品、欠損表情の勝手な新デザイン |
| 世界画像の確認済みモチーフ | 旧絵から勝手に確定する新しい歴史・地理 |
| 既存Pamera名・カード画像・Arcana記述 | 22柱NPC、未知のArcana対応表、覚醒設定の補完 |
| 既存ポータル、既存星界説明、`/seimei-card/` | Phase 1のついでの修正・ナビ改造・デザイン変更 |

## 14. Unknowns / TODO

| ID | 未確定事項 | 解決が必要な時点 |
| --- | --- | --- |
| TODO-SW-STATE | 実機にあるSW登録・旧キャッシュ・現在の配信状態 | Phase 2本番相当検証前 |
| TODO-HTTP-HEADERS | CSP、X-Frame-Options、JSのContent-Type、候補URLの実HTTP動作。直接ヘッダー取得は実行環境で完了できず | Phase 2の公開検証／Phase 6のiframe採用前 |
| CONFIG-THREE-VERSION | Three.jsの固定版、内部依存、最低Safari／WebGL要件 | 明示的なPhase 2開始後 |
| TODO-IOS | 実機の縦横、左右同時操作、低性能端末、ホーム画面起動、音声復帰 | Phase 2受入および後続接続時 |
| TODO-SHIOPON-ALPHA | 真の透過全身原本。ファイル名から存在を推定しない | Phase 5前 |
| TODO-SKIT-ASSETS | 表情25不足＋4空。既存JSONを改変せず、採用する1～3本をまず限定 | Phase 5前 |
| CONFIG-SKIT-NEXT | 「まだ一緒にいる」の次話範囲と、エラーを含む全退出経路 | Phase 5前 |
| CONFIG-ROOM-ERA | 閲覧者に語る既存ルームと1000年前のシオン視点の関係 | Phase 6前 |
| TODO-ROOM-AUDIO | 元URLのiframe許可、内部遷移時の帰路、二重再生防止、実機フェード | Phase 6前 |
| CONFIG-RESONANCE-ID | v0.3内の説明例と状態名例の整理、Eraとの差分優先順位 | 状態データを導入する前 |
| TODO-ARCANA-MAPPING | 独自名5件・既存Pameraキーと将来22経路の正式対応 | 将来のArcana実装前 |
| TODO-VISUAL-SOURCES | 王宮遠景、庭園、固有植物の確定デザインと素材 | 各ビジュアルPhase前 |

不明な点は上記として分離し、公式設定を追加していない。「星界は星の国へ想いが重なる層」「星の国は完全消滅していない」「初期は1000年前」「Pamera本人は初期MVPに出さない」を最上位仕様として維持する。既存資料の曖昧な説明を、別マップ・完全滅亡・新規の公式歴史へ読み替えない。

### 監査と検証の実施範囲

- 指定コミットを取得し、追跡ファイル530件のパス一覧を確認。関連コードを精読し、全実装ファイルのThree.js／WebGL／module／CSP／SWのシグネチャを検索した。無関係なページの全面監査は行っていない。
- スキット31本を解析。301ノードの開始・next／choices遷移先と、表示対象の表情参照を照合。有効な参照画像はデコード確認した。
- しおぽん・ルーム素材の形式／寸法／alpha、世界画像の原画像と寸法を確認。MP3拡張子9ファイルの形式・時間を調べ、同一音源はバイトハッシュで照合した。
- GitHub APIでdefault branchと両ブランチの全ファイル差分を確認。Pagesの成功実行・buildログでmain／root公開を確認した。
- 公開ルームのHTML取得は確認したが、対話・音・Safari実機・3D性能は未検証。HTTPヘッダー取得も完了していない。これらを合格済みとして扱っていない。
- 本書の追加差分と空白エラーを確認し、既存追跡ファイルが変更されていないことをGitで検証した。ゲーム用ディレクトリは未作成。

## 15. Phase 2 Go / No-Go

**GO WITH CONDITIONS**

理由：候補パスに衝突はなく、既存サイトの静的公開方式と独立ESM構成は整合する。三層を共通座標と状態差分で分離する設計も可能。スキットとルームには再利用できる実体がある。一方、モバイルの動作、ルートSW、欠損素材、ルームとの帰路・音制御は未解決なので、無条件のGOやMVP完成可能性の保証にはしない。

Phase 2開始時の条件：

1. **ユーザーが明示的にPhase 2を指示した後に開始する。** 本書の判定を開始許可と扱わない。
2. 独立ブランチ・独立ページで、graybox、歩行、一人称カメラ、スマホ操作だけを実装対象にする。既存ページ・スキット・ルーム・音源は変更しない。
3. Three.jsの版と対象Safariを固定し、ローカル試作の後にiPhone／iPadの縦横・同時タッチ・キャンセルを受入確認する。
4. 本番相当の検証と入口公開の前にSWと配信条件を確認する。既存SWの修正が必要になった場合は、別の具体的な変更として扱い、ついでに変更しない。
5. スキット、ルーム、Billboardの課題は各接続Phaseの条件として残す。Phase 2を進めるために、それらを先行実装しない。

**停止点：Phase 1監査レポートの作成・検証・PR提出まで。Phase 2以降は未着手。**
