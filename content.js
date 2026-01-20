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

    // 期限の取得（"～" の後ろの日付）
    // 詳細ページ特有の <span class="fromto">～</span> の隣の要素
    const deadlineElement = document.querySelector('.fromto + span');
    if (!deadlineElement) return;

    // 課題名の取得
    let taskTitle = null;
    const labels = document.querySelectorAll('label.ui-outputlabel');
    
    // テーブル内のラベルから「課題名」を探し、その隣のセルの値を取る
    labels.forEach(label => {
        if (label.innerText.trim() === "課題名") {
            const titleCell = label.closest('td').nextElementSibling;
            if (titleCell) {
                taskTitle = titleCell.innerText.trim();
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