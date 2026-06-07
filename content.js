// --- content.js (バグ修正版) ---

// 日付文字列を正規化し、必要なら00:00の期限を修正する関数
const normalizeAndAdjustDate = (rawDateStr) => {
    if (!rawDateStr) return null;

    let cleanStr = rawDateStr.trim();
    cleanStr = cleanStr.replace(/\([^\)]+\)/g, ''); 

    if (cleanStr.match(/0{1,2}:00/)) {
        const dateObj = new Date(cleanStr.replace(/-/g, '/'));
        
        if (!isNaN(dateObj.getTime())) {
            dateObj.setDate(dateObj.getDate() - 1);
            
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const d = String(dateObj.getDate()).padStart(2, '0');
            
            return `${y}/${m}/${d} 23:59`;
        }
    }

    return cleanStr;
};

const scrapeDetailOnly = () => {
    const detailHeader = document.querySelector('.cpTgtName');
    
    if (!detailHeader) {
        return;
    }

    let taskTitle = null;
    let rawDeadlineDate = null;

    const tdHeaders = document.querySelectorAll('td.ui-widget-header');
    
    tdHeaders.forEach(td => {
        const headerText = td.innerText.trim();

        // 1. 課題名の取得
        if (headerText === "課題名") {
            const titleCell = td.nextElementSibling;
            if (titleCell) taskTitle = titleCell.innerText.trim();
        }

        // 2. 課題提出期間の取得
        if (headerText === "課題提出期間") {
            const periodCell = td.nextElementSibling;
            if (periodCell) {
                const deadlineSpan = periodCell.querySelector('.fromto + span');
                if (deadlineSpan) {
                    rawDeadlineDate = deadlineSpan.innerText.trim(); // ここで文字列として取得済み
                }
            }
        }
    });

    if (!taskTitle) {
        taskTitle = detailHeader.innerText.split('\n')[0].trim();
    }

    // 【修正箇所】変数名を統一し、取得失敗時のガードを追加
    if (taskTitle && rawDeadlineDate) {
        const finalDate = normalizeAndAdjustDate(rawDeadlineDate);

        console.log(`詳細ページ取得成功: ${taskTitle} (期限: ${finalDate})`);

        chrome.runtime.sendMessage({ 
            type: "SAVE_TASKS", 
            data: [{ title: taskTitle, date: finalDate }] 
        });
    } else {
        console.warn("[UNIPA-Reminder] 課題名または提出期限の特定に失敗したため、送信をスキップしました。", {
            taskTitle,
            rawDeadlineDate
        });
    }
};

setTimeout(scrapeDetailOnly, 1500);