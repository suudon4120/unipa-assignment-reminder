// 保存ボタンが押されたらストレージに保存
document.getElementById('save').addEventListener('click', () => {
    const url = document.getElementById('webhookUrl').value;
    
    if (!url) {
        alert("URLを入力してください");
        return;
    }

    chrome.storage.local.set({ slackWebhookUrl: url }, () => {
        // 保存完了メッセージを表示
        const status = document.getElementById('status');
        status.textContent = '設定を保存しました！';
        setTimeout(() => { status.textContent = ''; }, 2000);
    });
});

// 設定画面が開かれたら、保存されているURLを表示
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['slackWebhookUrl'], (result) => {
        if (result.slackWebhookUrl) {
            document.getElementById('webhookUrl').value = result.slackWebhookUrl;
        }
    });
});