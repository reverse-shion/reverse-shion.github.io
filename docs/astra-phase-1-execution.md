# TAROT BREAKER 3Dワールド
## Astra Phase 1 実行指示書

このPhaseでは、3Dゲーム本体を実装しない。
目的は、既存GitHubリポジトリを正確に監査し、既存資産を壊さず再利用できる状態を把握して、Phase 2の実装判断材料を作ることだけである。

---

## 0. 最上位仕様

必ず最初に以下を読むこと。

`docs/tarot-breaker-3d-spec-v0.3.md`

この文書をTAROT BREAKER 3Dワールド開発の最上位仕様とする。

特に以下の定義を変更してはいけない。

- 星の国 = 1000年前にシオンが王として治めていた実在する王国・文明圏
- 星の国は壊れかけているが完全消滅していない
- 想いが存在する限り完全な滅亡には至らない
- 星界 = 星の国へ人の想い・記憶・願い・祈り・後悔・愛などが重なった共鳴的・異次元的な空間
- 星の国と星界は別マップではなく、同じ場所に複数の層が存在する
- 3D世界は Base World / Era State / Resonance Layer の三層構造を前提とする
- 初期MVPは1000年前の美しい星の国を中心にする
- Pamera本人は初期MVPでは登場させない
- 既存スキット、リュミエールの間、既存音源、既存キャラクター資産を作り直さない

仕様と既存コードに矛盾がある場合、勝手に設定を補完・変更しない。
`TODO` / `PLACEHOLDER` / `CONFIG` として報告すること。

---

# 1. 今回実行する範囲

Phase 1で実行するのは以下のみ。

1. 既存GitHubリポジトリ監査
2. TAROT BREAKER関連の既存資産一覧化
3. 既存機能の依存関係確認
4. 3Dワールド追加時の本番サイトへの影響確認
5. Phase 2で安全に実装を開始するための設計判断材料作成
6. 監査レポート作成

以上で終了する。

---

# 2. 今回絶対に実装しないもの

このPhaseでは以下を作らない。

- Three.js導入
- 3D Canvas
- 3Dマップ
- `/tarot-breaker/starworld/` のゲーム本体
- graybox
- プレイヤー移動
- カメラ
- 仮想スティック
- 星空
- フォグ
- ライティング
- 星界植物
- 水盤
- 星門
- 王宮遠景
- しおぽん配置
- スキット接続実装
- リュミエールの間との接続実装
- Arcana Path
- Pamera
- Resonance Manager
- Era Manager
- BGM追加
- LocalStorage追加
- 新しい公式設定
- 既存UIのリファクタリング
- 既存ページのデザイン変更

Phase 2以降のコードを書かないこと。

---

# 3. Git運用

`main`へ直接変更を加えない。

この仕様書が存在するブランチを確認し、Phase 1を実行する場合は監査専用ブランチを使用する。

推奨ブランチ名：

`feature/tarot-breaker-3d-phase1-audit`

Phase 1で許可される変更は、原則として監査レポート等のドキュメント追加だけとする。

既存HTML / CSS / JS / JSON / 画像 / 音源は変更しない。

自動的にmainへマージしない。

---

# 4. 最優先で確認する既存資産

リポジトリ全体を無目的に読み続けない。
まずTAROT BREAKER 3Dワールドと直接関係する資産を優先して確認する。

## A. 既存スキット

最低限確認：

- `js/skitEngine.js`
- `skits/`
- `skits/manifest.json`
- 各スキットJSON
- `assets/skit/`
- スキット関連CSS
- スキット起動方法
- スキット終了イベントまたは閉じる処理
- スキット表示中のDOM構造
- スキットが他ページから再利用可能か

確認目的：

Phase 5で3D操作を停止 → 既存スキット表示 → 終了 → 3Dへ復帰、が可能か判断する。

スキット本文や既存JSONを変更しない。

---

## B. リュミエールの間

最低限確認：

- `lumiere-gate.html`
- `assets/lumiere/`
- `img/lumiere-full.png`
- 目ぱち処理
- 口パク処理
- 音楽ボタン
- 使用音源
- 音声再生開始条件
- iOS Safariでの音声制限対策
- 入室方法
- 退出／戻る導線
- URL構造

確認目的：

Phase 6で3D世界から既存のリュミエールの間へ安全に接続し、既存機能をそのまま再利用できるか判断する。

目ぱち、口パク、音楽機能を3D側で作り直さない。

---

## C. しおぽん

最低限確認：

- 透過全身素材
- 既存キャラクター画像
- bust素材
- 表情素材
- 目・口・耳等のレイヤー素材
- 現在の表示ロジック

確認目的：

初期探索時にBillboard等で再利用できる素材を特定する。

このPhaseでは3D空間へ配置しない。

---

## D. 世界観画像

最低限確認：

- `img/world/`
- 星の国・星界・星門関連画像
- 王宮／門／庭園／街／昼夜等の参考画像
- 既存TAROT BREAKERページで使われている背景

各画像について、以下を分類する。

1. 3Dテクスチャ等にそのまま使用可能
2. 遠景／背景カードとして使用可能
3. コンセプトアートとしてのみ参照
4. 使用非推奨

Phase 1では画像自体を加工しない。

---

## E. 音源

TAROT BREAKERおよびリュミエール関連音源を確認する。

確認項目：

- ファイルパス
- 形式
- 現在使用中のページ
- 再生ロジック
- ループ有無
- ユーザー操作後再生か
- 同時再生リスク

3D側の新BGMは追加しない。

---

# 5. 現在のサイト構造監査

以下を確認する。

- GitHub Pagesの公開方式
- default branch
- ルート構造
- `/tarot-breaker/` 周辺の現在のURL構成
- 相対パス／絶対パスの使われ方
- 共通CSS
- 共通JavaScript
- Service Workerの有無
- manifestの有無
- import map / module scriptの有無
- CDN依存
- ページ遷移方式
- キャッシュ方式
- モバイル向けviewport設定
- iPhone Safe Area対応

目的は、Phase 2で3D用独立ディレクトリを追加した際に既存公開ページを壊さないためである。

---

# 6. `/tarot-breaker/starworld/` 候補パスの安全性確認

v0.3では3Dワールド用候補として、

`/tarot-breaker/starworld/`

を想定している。

Phase 1で以下を確認する。

- 現在同名ディレクトリが存在しないか
- `/tarot-breaker/` の既存ルーティングと衝突しないか
- GitHub Pagesで直接アクセス可能か
- 既存相対パスとの衝突がないか
- 既存assetsを再利用する際の正しい相対パス

もしより安全なパスがある場合は提案してよい。

ただしPhase 1ではディレクトリを作らない。

---

# 7. Three.js導入前監査

Three.js自体はまだ導入しない。

確認だけ行う。

- リポジトリ内に既にThree.js / WebGL / Canvas 3D実装があるか
- ES Modulesを安全に利用できるか
- build stepなしの静的構成と相性が良いか
- GitHub Pages上でCDN importが問題ないか
- Content Security Policy等の制約があるか
- 既存ライブラリとの競合可能性

Phase 2での候補方式を1つ推奨する。

複数案を大量に提示しない。

---

# 8. モバイル監査

このプロジェクトはiPhone / iPad Safariを最優先する。

現在のサイトから以下を確認する。

- viewport
- touchイベント
- pointerイベント
- `100vh`問題への対応状況
- Safe Area
- 音声再生制限
- orientation
- スクロールとゲーム操作の競合可能性
- 既存CSSが3D Canvasへ影響する可能性

このPhaseでは修正しない。

Phase 2以降で必要になる対策を監査レポートへ記載するだけにする。

---

# 9. Base World / Era State / Resonance Layer の実装可能性確認

コードは作らない。

v0.3で定義されている三層構造、

1. Base World
2. Era State
3. Resonance Layer

を既存サイトへ追加する場合、どのような分離方法なら安全かだけ検討する。

Phase 2以降で、同じ3Dマップを複製せず状態差分で表現できるようにする。

Phase 1では以下だけ報告する。

- 推奨責務分離
- 推奨データ構造
- 既存資産との接続点
- 将来の拡張リスク

実装しない。

---

# 10. Pameraについて

Phase 1ではPameraの実装・配置・新規デザインを一切行わない。

確認してよいのは、将来のArcana Path用データ構造が既存設定と衝突しないために必要な既存ファイル・命名だけ。

Pameraは初期MVPのNPCではない。

Pamera関連設定を勝手に補完しない。

---

# 11. 既存サイトへの影響確認

Phase 2で3Dワールドを追加した場合に想定されるリスクを洗い出す。

最低限、以下を評価する。

- 既存ページ表示
- ナビゲーション
- CSS競合
- JavaScriptグローバル競合
- スキット
- リュミエールの間
- 音源
- モバイル表示
- GitHub Pages公開
- 読み込み速度
- キャッシュ

各リスクを、

- Low
- Medium
- High

で分類する。

---

# 12. Phase 1成果物

Phase 1終了時、以下の監査レポートを作成する。

推奨保存先：

`docs/tarot-breaker-3d-phase1-audit.md`

レポートには以下を含める。

## 1. Executive Summary

現在のリポジトリへ3Dワールドを安全に追加できるか。

## 2. Existing Asset Inventory

表形式で、

- path
- 内容
- 現在の用途
- 3Dでの再利用方法
- 変更必要性
- リスク

を整理。

## 3. Skit Integration Findings

既存スキットを再利用するための接続点。

## 4. Lumière Room Findings

既存リュミエールの間を再利用するための接続点と音制御上の注意。

## 5. Shiopon Asset Findings

初期Billboard候補素材。

## 6. World / Visual Asset Findings

星の国・星界・星門等の既存ビジュアル資産。

## 7. Audio Findings

既存音源と再生ロジック。

## 8. GitHub Pages / Routing Findings

3Dワールド追加時のURL・相対パス・公開上の注意。

## 9. Mobile / iOS Findings

iPhone / iPad Safariで予想される問題。

## 10. Risk Matrix

Low / Medium / High。

## 11. Recommended Phase 2 Architecture

実際の既存コードを確認した結果として、Phase 2で推奨する最小構成。

ここでは設計提案のみ。
コードは書かない。

## 12. Recommended Directory Structure

既存構造を監査した結果として、最も安全なディレクトリ構成を提案。

ディレクトリ自体はまだ作らない。

## 13. Reuse / Do Not Rebuild List

既存資産のうち、必ず再利用すべきものを明示。

## 14. Unknowns / TODO

仕様として不明なもの。

勝手に補完しない。

## 15. Phase 2 Go / No-Go

Phase 2へ進めるかを、

`GO`

`GO WITH CONDITIONS`

`NO-GO`

のいずれかで判定し、その理由を記載する。

---

# 13. Astra使用量を抑えるためのルール

このPhaseでは、必要以上に作業を広げない。

- 関係のないページを全面監査しない
- UI改善案を大量に出さない
- 世界設定を再構築しない
- 3D技術比較を大量に行わない
- コードを書き始めない
- 「ついでの改善」をしない
- 既存コードをリファクタリングしない

目的は監査だけ。

必要な事実を確認したらレポートを作り、停止すること。

---

# 14. 完了条件

以下を満たした時点でPhase 1を終了する。

- v0.3仕様書を読んだ
- 既存TAROT BREAKER資産を特定した
- スキット再利用可否を確認した
- リュミエールの間再利用可否を確認した
- しおぽん素材を確認した
- 既存音源を確認した
- GitHub Pages構造を確認した
- `/tarot-breaker/starworld/` 候補の安全性を確認した
- iPhone / iPad向けリスクを確認した
- 既存サイトへの影響を整理した
- Phase 2推奨構造を提案した
- `docs/tarot-breaker-3d-phase1-audit.md` を作成した

完了後、それ以上実装を進めない。

---

# 15. 最終報告形式

Phase 1終了時は、長い説明をチャットへ重複して貼らず、以下だけ報告する。

1. Phase 1監査完了 / 未完了
2. 監査レポートのパス
3. 最大のリスク3件以内
4. 再利用できる主要資産
5. Phase 2判定：GO / GO WITH CONDITIONS / NO-GO
6. 作成したブランチ／PR

Phase 2はユーザーの明示的な指示があるまで開始しない。
