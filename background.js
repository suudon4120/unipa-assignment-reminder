// 拡張機能起動時またはインストール時にアラームをセット
chrome.runtime.onInstalled.addListener(() => {
    setupAlarm();
});

function setupAlarm() {
    const now = new Date();
    const target = new Date();
    target.setHours(16, 0, 0, 0); // 16:00に設定

    if (now > target) {
        target.setDate(now.getDate() + 1);
    }

    const delay = target.getTime() - now.getTime();
    chrome.alarms.create("dailyReminder", {
        when: Date.now() + delay,
        periodInMinutes: 1440 // 24時間おきに定期実行
    });
    console.log("16時のアラームをセットしました。");
}

// メッセージ受信（新着チェック用）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SAVE_TASKS") {
        const newTasks = message.data;

        chrome.storage.local.get(["oldTasks"], (result) => {
            const oldTasks = result.oldTasks || [];
            
            // 完全に一致（タイトルと日付）しないものだけを「新規」とする
            const addedTasks = newTasks.filter(n => 
                !oldTasks.some(o => o.title === n.title && o.date === n.date)
            );

            if (addedTasks.length > 0) {
                sendToSlack(`🆕 *新しい課題が登録されました*\n` + formatTaskList(addedTasks));
            }

            // 最新の全リストを保存
            chrome.storage.local.set({ oldTasks: newTasks });
        });
    }
    return true;
});

// アラーム発火（16時の明日締切チェック用）
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "dailyReminder") {
        checkAndRemindTomorrow();
    }
});

async function checkAndRemindTomorrow() {
    chrome.storage.local.get(["oldTasks"], (result) => {
        const tasks = result.oldTasks || [];
        
        // 「明日」の日付文字列 (YYYY/MM/DD)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yStr = tomorrow.getFullYear();
        const mStr = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dStr = String(tomorrow.getDate()).padStart(2, '0');
        const tomorrowTarget = `${yStr}/${mStr}/${dStr}`;

        const urgentTasks = tasks.filter(t => t.date === tomorrowTarget);

        if (urgentTasks.length > 0) {
            sendToSlack(`⏰ *16時です。明日締切の課題があります！*\n` + formatTaskList(urgentTasks));
        }
    });
}

function formatTaskList(tasks) {
    return tasks.map(t => `• *${t.title}*\n  期限: ${t.date}`).join("\n");
}

async function sendToSlack(messageText) {
    // ストレージからURLを取得
    chrome.storage.local.get(['slackWebhookUrl'], async (result) => {
        const webhookUrl = result.slackWebhookUrl;

        if (!webhookUrl) {
            console.error("Slack Webhook URLが設定されていません。拡張機能のオプションから設定してください。");
            return;
        }

        try {
            const response = await fetch(webhookUrl, {
                method: "POST",
                body: JSON.stringify({ text: messageText })
            });
            if (!response.ok) {
                console.error("Slack送信エラー:", response.status);
            }
        } catch (e) {
            console.error("Slack送信通信エラー", e);
        }
    });
}