# TAROT BREAKER 3D — Phase 2 prototype

実行基準はユーザー指定の **Astra Phase 2 v1.1**。最上位の世界観仕様は `../../docs/tarot-breaker-3d-spec-v0.3.md`。Phase 1監査の旧Phase分割に対して、今回明示された「スキット接続・音状態管理」までを最小範囲に含める。Phase 3以降へは進まない。

## 起動

リポジトリのルートで `python -m http.server 8000` を実行し、`http://localhost:8000/tarot-breaker-3d/prototype/index.html` を開く。静的配信のみ。ビルド、CDN、外部API、DB、保存領域は不要。

- GAME START → 左スティックで正面の光へ移動 → ふたりと話す → 会話枠をタップ → 会話を終える → 同じ位置・向きへ戻る。
- 右側のドラッグで視点。PCはWASD／矢印、マウスドラッグ、E。視点に揺れ・慣性・自動回転なし。
- 音楽は初期OFF。「音楽 ON/OFF」は会話中にも使用可能。
- 最後まで読む／途中の「星界へ戻る」／上部の戻る／Escapeで退出可能。同じ光で繰り返し起動できる。
- タブ切替・中断で移動・描画・音を止め、「散歩を再開」から復帰。中断時の会話は閉じ、次は最初から読む。

## 構成

`data/` は仮マップ・イベント・キャラクター。`js/state.js` はDOM非依存の位置・視点・イベント状態。`input.js` は入力、`world.js` は描画、`skit-bridge.js` は既存エンジン接続、`audio.js` は単一音源、`app.js` はライフサイクルの所有者。

既存 `skits/skit_005.json`（全8ノード）を原文のまま使用。キャラクター3人は会話で表示し、3Dの光は会話地点の仮マーカー。人物の姿を置き換えたものではない。リュミエールの間本体への接続、別マップ、現代、ゲーム進行、保存は含まない。

ルート相対をBridgeで組立て直し、リポジトリをサブパスへ配信しても参照先が追従する。既存エンジンの変更は `useStoredName`（既定true）と保存読込失敗時のfallbackのみ。試作はfalseを指定し、閲覧者の保存名を読まず、書かない。会話・表情・分岐の描画は既存実装を使用。共有エンジンの本体を複製しない。

## 検証

Node.js 22以上、テスト用のjsdom 26.1.0を使用。テスト依存は配信に不要。

```sh
npm install --prefix /tmp/tb-phase2-tests --ignore-scripts --no-audit --no-fund jsdom@26.1.0
PHASE2_NODE_MODULES=/tmp/tb-phase2-tests/node_modules node --test tarot-breaker-3d/prototype/tests/*.test.mjs
```

状態・衝突・入力キャンセル、実エンジンで20回の会話、遅延fetch競合、保存拒否、音源重複・非同期再生拒否、Three.js import、サブパスでのHTTP/MIMEと素材参照を検証する。jsdomは実ブラウザ・GPU・実機操作・聴取の代用ではない。

## 対象と制限

- WebGL 2必須、設計対象はiOS/iPadOS Safari 16.4以上および現行Android Chrome／PCブラウザ。実機保証はまだ行わない。
- DPR上限1.5。影・ポストプロセス・全表情先読みなし。会話中・背景時は3Dフレームループを止める。
- 版固定のThree.js 0.180.0を同梱。`vendor/three-0.180.0/provenance.json` に由来・SHA-256、同フォルダーにMITライセンス。
- 新規Service WorkerやCache API操作を追加しない。既存ルートSWを解除／削除しない。
- 内部importを含む独自資産と再利用資産に `v=p2-1.1.0`。更新時は独自コード全体の版を揃えて変更し、vendorは新バージョンディレクトリを使う。古いHTML自体や旧SWの影響は実機確認が必要。

受入条件・判定・未検証項目は `../../docs/tarot-breaker-3d-phase2-report.md` を参照。
