// background.js

// 拡張機能起動時またはインストール時にアラームをセット
chrome.runtime.onInstalled.addListener(() => {
    setupAlarm();
});

function setupAlarm() {
    const now = new Date();
    const target = new Date();
    target.setHours(16, 0, 0, 0); 

    if (now > target) {
        target.setDate(now.getDate() + 1);
    }

    const delay = target.getTime() - now.getTime();
    chrome.alarms.create("dailyReminder", {
        when: Date.now() + delay,
        periodInMinutes: 1440 
    });
}

// メッセージ受信（新着チェック用）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SAVE_TASKS") {
        const currentMsgTasks = message.data; // 今、画面で見えている課題たち

        chrome.storage.local.get(["oldTasks"], (result) => {
            // これまでに保存してある全課題リスト（なければ空配列）
            let storedTasks = result.oldTasks || [];
            let tasksToNotify = [];

            currentMsgTasks.forEach(newTask => {
                // 保存済みリストの中に、全く同じ（タイトルと期限が一致）課題があるか？
                const exists = storedTasks.some(stored => 
                    stored.title === newTask.title && stored.date === newTask.date
                );

                // まだ保存されていない未知の課題なら
                if (!exists) {
                    tasksToNotify.push(newTask);
                    storedTasks.push(newTask); // 保存リストに追加（統合）
                }
            });

            // 新しいものがあった場合のみ通知
            if (tasksToNotify.length > 0) {
                console.log("新着課題を検出:", tasksToNotify);
                sendToSlack(`🆕 *新しい課題が登録されました*\n` + formatTaskList(tasksToNotify));
            } else {
                console.log("新着課題はありませんでした。");
            }

            // 【重要】統合された最新リストを保存し直す
            chrome.storage.local.set({ oldTasks: storedTasks });
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

        // 期限には " 23:59" などが含まれる場合があるため、前方一致で判定する
        const urgentTasks = tasks.filter(t => t.date.startsWith(tomorrowTarget));

        if (urgentTasks.length > 0) {
            sendToSlack(`⏰ *16時です。明日締切の課題があります！*\n` + formatTaskList(urgentTasks));
        }
    });
}

function formatTaskList(tasks) {
    return tasks.map(t => `• *${t.title}*\n  期限: ${t.date}`).join("\n");
}

async function sendToSlack(messageText) {
    chrome.storage.local.get(['slackWebhookUrl'], async (result) => {
        const webhookUrl = result.slackWebhookUrl;
        if (!webhookUrl) return;

        try {
            await fetch(webhookUrl, {
                method: "POST",
                body: JSON.stringify({ text: messageText })
            });
        } catch (e) {
            console.error("Slack送信エラー", e);
        }
    });
}