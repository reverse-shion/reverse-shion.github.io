# TAROT BREAKER 3D — Phase 2 prototype

実行基準はユーザー指定の **Astra Phase 2 v1.1**。最上位の世界観仕様は `../../docs/tarot-breaker-3d-spec-v0.3.md`。Phase 1監査の旧Phase分割に対して、今回明示された「スキット接続・音状態管理」までを最小範囲に含める。Phase 3以降へは進まない。

## 起動

リポジトリのルートで `python -m http.server 8000` を実行し、`http://localhost:8000/tarot-breaker-3d/prototype/index.html` を開く。静的配信のみ。ビルド、CDN、外部API、DB、保存領域は不要。

## モバイル操作 v1.5

- プレイヤーは「観測者」。ゲーム中は1000年前のシオンの視界を追体験する。
- 画面上の仮想スティックは表示しない。
- ゲーム画面のどこでも、上スワイプ＝前進、下＝後退、左／右＝その方向へ横移動。
- スワイプ方向は上下左右4方向のどれかへ確定する。斜め入力を作らず、指の微妙なブレを移動方向へ混ぜない。
- スワイプ完了後も入力を保持して一定速度で歩き続ける。画面を1回タップすると停止する。短いスワイプを何度も繰り返す方式にはしない。
- `視点追尾 ON/OFF` を右上に配置。ONでは移動中に縦方向の視線を自然に水平へ戻し、OFFでは現在の視線角度を保持する。
- 二本目の指を同時にドラッグすると手動で視点を調整できる。
- iOS Safariの文字選択、長押しコールアウト、ページスクロールをゲーム面では抑止する。
- PCはWASD／矢印、マウスドラッグ、Spaceで停止、Eで会話。

GAME START → 正面の光へ移動 → 会話開始 → 会話を終える → 同じ位置・向きへ戻る。光のイベント範囲へ入ると移動を停止して会話を自動開始する。

## 構成

`data/` は仮マップ・イベント・キャラクター。`js/state.js` はDOM非依存の位置・視点・イベント状態。`input.js` は入力、`world.js` は描画、`skit-bridge.js` は既存エンジン接続、`audio.js` は単一音源、`app.js` はライフサイクルの所有者。

既存 `skits/skit_005.json`（全8ノード）を原文のまま使用。キャラクター3人は会話で表示し、3Dの光は会話地点の仮マーカー。人物の姿を置き換えたものではない。リュミエールの間本体への接続、別マップ、現代、ゲーム進行、保存は含まない。

## 検証

Node.js 22以上、テスト用のjsdom 26.1.0を使用。テスト依存は配信に不要。

```sh
npm install --prefix /tmp/tb-phase2-tests --ignore-scripts --no-audit --no-fund jsdom@26.1.0
PHASE2_NODE_MODULES=/tmp/tb-phase2-tests/node_modules node --test tarot-breaker-3d/prototype/tests/*.test.mjs
```

jsdomは実ブラウザ・GPU・実機操作・聴取の代用ではない。iPhone実機の操作感を最終受入基準とする。

## 対象と制限

- WebGL 2必須、設計対象はiOS/iPadOS Safari 16.4以上および現行Android Chrome／PCブラウザ。実機保証はまだ行わない。
- DPR上限1.5。影・ポストプロセス・全表情先読みなし。会話中・背景時は3Dフレームループを止める。
- 版固定のThree.js 0.180.0を同梱。`vendor/three-0.180.0/provenance.json` に由来・SHA-256、同フォルダーにMITライセンス。
- 新規Service WorkerやCache API操作を追加しない。既存ルートSWを解除／削除しない。
- 独自資産のキャッシュ識別は `v=p2-1.5.0`。

受入条件・判定・未検証項目は `../../docs/tarot-breaker-3d-phase2-report.md` を参照。
