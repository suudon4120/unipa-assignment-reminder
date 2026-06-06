// --- content.js (詳細ページ専用版) ---

// 日付文字列を正規化し、必要なら00:00の期限を修正する関数
const normalizeAndAdjustDate = (rawDateStr) => {
    if (!rawDateStr) return null;

    // 文字列のクリーニング（前後の空白削除）
    let cleanStr = rawDateStr.trim();

    // 曜日情報「(月)」などを削除し、フォーマットを統一する
    cleanStr = cleanStr.replace(/\([^\)]+\)/g, ''); 

    // "00:00" または "0:00" が含まれているかチェック
    if (cleanStr.match(/0{1,2}:00/)) {
        const dateObj = new Date(cleanStr.replace(/-/g, '/')); // ブラウザ互換性のためハイフンをスラッシュに
        
        if (!isNaN(dateObj.getTime())) {
            // 日付を1日戻す
            dateObj.setDate(dateObj.getDate() - 1);
            
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const d = String(dateObj.getDate()).padStart(2, '0');
            
            const newDeadline = `${y}/${m}/${d} 23:59`;
            console.log(`[Safety] 00:00期限を前倒ししました: ${rawDateStr} -> ${newDeadline}`);
            return newDeadline;
        }
    }

    // 曜日を除去した文字列を返す
    return cleanStr;
};

const scrapeDetailOnly = () => {
    // 詳細ページかどうかを判定（.cpTgtName = 科目名エリアがあるか）
    const detailHeader = document.querySelector('.cpTgtName');
    
    if (!detailHeader) {
        // 詳細ページでなければ何もしない
        return;
    }

    let taskTitle = null;
    let rawDeadlineDate = null;

    // テーブル内のすべてのヘッダーセル（td）を走査
    const tdHeaders = document.querySelectorAll('td.ui-widget-header');
    
    tdHeaders.forEach(td => {
        const headerText = td.innerText.trim();

        // 1. 課題名の取得
        if (headerText === "課題名") {
            const titleCell = td.nextElementSibling;
            if (titleCell) taskTitle = titleCell.innerText.trim();
        }

        // 2. 【修正】課題提出期間の取得
        if (headerText === "課題提出期間") {
            const periodCell = td.nextElementSibling;
            if (periodCell) {
                // 「～」の後ろにある最後の span（終了日時）をピンポイントで取得
                const deadlineSpan = periodCell.querySelector('.fromto + span');
                if (deadlineSpan) {
                    rawDeadlineDate = deadlineSpan.innerText.trim();
                }
            }
        }
    });

    // 課題名が見つからない場合、ヘッダーの科目名を代用するなどの保険
    if (!taskTitle) {
        taskTitle = detailHeader.innerText.split('\n')[0].trim(); // 科目名など
    }

    // データの正規化と保存リクエスト
    const rawDate = deadlineElement.innerText.trim();
    const finalDate = normalizeAndAdjustDate(rawDate);

    console.log(`詳細ページ取得: ${taskTitle} (期限: ${finalDate})`);

    // 配列に入れて送信（background.jsの形式に合わせる）
    chrome.runtime.sendMessage({ 
        type: "SAVE_TASKS", 
        data: [{ title: taskTitle, date: finalDate }] 
    });
};

// ページ読み込み完了後に実行
setTimeout(scrapeDetailOnly, 1500);