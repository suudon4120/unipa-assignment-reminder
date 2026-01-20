# UNIPA Task Reminder for Slack

大学のポータルサイト「UNIPA」の課題提出期限を自動取得し、Slackに通知・リマインドするGoogle Chrome拡張機能です。

## 機能
- 🆕 **新着通知**: UNIPAを開いた時、新しい課題があればSlackに通知します。
- ⏰ **リマインド**: 毎日16時に、明日が提出期限の課題があればリマインドします。
- 🚫 **フィルタリング**: 「掲示」などは除外し、「課題」のみを通知します。

## インストール方法
1. このリポジトリをZIPでダウンロード（またはClone）して解凍する。
2. Chromeの `chrome://extensions/` を開く。
3. 右上の「デベロッパーモード」をONにする。
4. 「パッケージ化されていない拡張機能を読み込む」をクリックし、解凍したフォルダを選択。

## 設定方法
1. Slackの [Incoming Webhook] を発行する。
2. Chrome拡張機能のアイコンを右クリックし「オプション」を選択。
3. Webhook URLを入力して保存する。

## 使用技術
- JavaScript
- Manifest V3
- Chrome Storage API / Alarms API