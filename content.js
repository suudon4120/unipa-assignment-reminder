// content.js

const scrapeDeadlines = () => {
    const tasks = [];
    const items = document.querySelectorAll('.ui-datalist-item');

    items.forEach(item => {
        const isKadai = item.querySelector('.signPortalKadai');
        const hasDeadlineLabel = item.querySelector('.textLimitdate');
        
        if (isKadai && hasDeadlineLabel) {
            const title = item.querySelector('.textTitle')?.innerText.trim();
            
            const date = item.querySelector('.textLimitdate ~ .textDate')?.innerText.trim();
            
            // 念のためログで確認（デバッグ用）
            console.log(`取得チェック: ${title} -> ${date}`);

            if (title && date) {
                tasks.push({ title, date });
            }
        }
    });

    if (tasks.length > 0) {
        chrome.runtime.sendMessage({ type: "SAVE_TASKS", data: tasks });
    }
};

setTimeout(scrapeDeadlines, 3000);