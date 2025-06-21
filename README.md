# 🍽️ 冷蔵庫トラッカー

レシート写真から食材を自動記録し、冷蔵庫の中身を効率的に管理できるWebアプリケーション

## ✨ 主な機能

- 📸 **レシート撮影機能**: カメラでレシートを撮影して食材を自動追加
- 🍎 **食材管理**: 購入日・賞味期限・数量を管理
- 📊 **スマートフィルタリング**: カテゴリ・状態・期限での絞り込み
- 📱 **モバイル対応**: レスポンシブデザインでスマホでも快適操作
- 💾 **オフライン対応**: ローカルストレージでデータ永続化
- 📈 **使用履歴**: 食材の使用・廃棄履歴を記録

## 🚀 デモ

**Live Demo**: [https://k-hironori.github.io/Refrigerator-Storage-Box/](https://k-hironori.github.io/Refrigerator-Storage-Box/)

## 🛠️ 技術スタック

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Browser localStorage
- **Camera**: getUserMedia API
- **Design**: Mobile-first responsive design
- **Deployment**: GitHub Pages

## 📱 対応デバイス

- 📱 スマートフォン (iOS/Android)
- 💻 PC/Mac
- 🖥️ タブレット

## 🎯 使い方

### 1. 食材を追加
- **レシート撮影**: カメラでレシートを撮影して自動追加
- **手動追加**: 「手動で追加」ボタンから個別に登録

### 2. 食材を管理
- 冷蔵庫タブで現在の食材一覧を確認
- カテゴリ・状態でフィルタリング
- 期限順でソート

### 3. 食材を使用・廃棄
- 各食材カードの「使用」「廃棄」ボタンで操作
- 履歴タブで過去の記録を確認

## 🔧 ローカル開発

```bash
# リポジトリをクローン
git clone https://github.com/K-hironori/Refrigerator-Storage-Box.git

# ディレクトリに移動
cd Refrigerator-Storage-Box

# ローカルサーバーで起動（例：Python）
python -m http.server 8000

# ブラウザでアクセス
# http://localhost:8000
```

## 📂 プロジェクト構造

```
Refrigerator-Storage-Box/
├── index.html          # メインHTML
├── styles.css          # スタイルシート
├── script.js           # JavaScript
├── README.md           # プロジェクト説明
└── .github/
    └── workflows/
        └── deploy.yml   # GitHub Pages自動デプロイ
```

## 📋 バージョン履歴

### v1.0.0 (2024-12-21) - 完全版リリース ✨
- ✅ **写真・動画撮影**: レシートキャプチャ機能完全実装
- ✅ **食材管理**: 購入日・賞味期限・数量管理
- ✅ **モバイル対応**: 完全レスポンシブデザイン
- ✅ **動画録画**: 録画中フレーム取得機能
- ✅ **改善されたUX**: 選択カウンター付きボタン
- ✅ **自動デプロイ**: GitHub Pages対応

## 🔮 今後の機能予定

- 🔍 実際のOCR機能統合
- 🔔 期限切れ通知機能
- 📊 食材消費レポート
- 🛒 ショッピングリスト機能
- 🌐 PWA対応

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 コントリビューション

プルリクエストやイシューの報告を歓迎します！

---

**🤖 Generated with [Claude Code](https://claude.ai/code)**