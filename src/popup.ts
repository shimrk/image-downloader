// ポップアップ画面のスクリプト
console.log('ポップアップ画面が読み込まれました');

// DOM要素の取得
const imageCountElement = document.getElementById('imageCount') as HTMLElement;
const downloadCountElement = document.getElementById('downloadCount') as HTMLElement;
const downloadAllBtn = document.getElementById('downloadAllBtn') as HTMLButtonElement;
const scanImagesBtn = document.getElementById('scanImagesBtn') as HTMLButtonElement;

// 統計データ
let stats = {
    imageCount: 0,
    downloadCount: 0
};

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('ポップアップ画面の初期化開始');

    // 現在のタブの情報を取得
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.id) {
        // コンテンツスクリプトにメッセージを送信して画像数を取得
        chrome.tabs.sendMessage(tab.id, { type: 'GET_IMAGE_COUNT' }, (response) => {
            if (chrome.runtime.lastError) {
                console.log('コンテンツスクリプトが読み込まれていません');
                updateStats(0, 0);
            } else {
                console.log('画像数を受信:', response);
                updateStats(response.imageCount || 0, response.downloadCount || 0);
            }
        });
    }

    // イベントリスナーの設定
    setupEventListeners();
});

// イベントリスナーの設定
function setupEventListeners(): void {
    // すべての画像をダウンロード
    downloadAllBtn.addEventListener('click', async () => {
        console.log('すべての画像をダウンロード');

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'DOWNLOAD_ALL_IMAGES' }, (response) => {
                if (chrome.runtime.lastError) {
                    showMessage('エラー: ページを再読み込みしてください', 'error');
                } else {
                    showMessage(`${response.downloadCount}個の画像をダウンロードしました`, 'success');
                    updateStats(stats.imageCount, stats.downloadCount + response.downloadCount);
                }
            });
        }
    });

    // 画像を再スキャン
    scanImagesBtn.addEventListener('click', async () => {
        console.log('画像を再スキャン');

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'SCAN_IMAGES' }, (response) => {
                if (chrome.runtime.lastError) {
                    showMessage('エラー: ページを再読み込みしてください', 'error');
                } else {
                    showMessage(`${response.imageCount}個の画像を検出しました`, 'success');
                    updateStats(response.imageCount, stats.downloadCount);
                }
            });
        }
    });
}

// 統計情報の更新
function updateStats(imageCount: number, downloadCount: number): void {
    stats = { imageCount, downloadCount };

    imageCountElement.textContent = imageCount.toString();
    downloadCountElement.textContent = downloadCount.toString();

    // ボタンの有効/無効を切り替え
    downloadAllBtn.disabled = imageCount === 0;
    downloadAllBtn.style.opacity = imageCount === 0 ? '0.5' : '1';
}

// メッセージ表示
function showMessage(message: string, type: 'success' | 'error'): void {
    // 既存のメッセージを削除
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.textContent = message;
    messageElement.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#4CAF50' : '#f44336'};
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 1000;
    animation: fadeIn 0.3s ease-out;
  `;

    // アニメーション用のCSS
    const style = document.createElement('style');
    style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `;
    document.head.appendChild(style);

    document.body.appendChild(messageElement);

    // 3秒後に自動削除
    setTimeout(() => {
        messageElement.remove();
        style.remove();
    }, 3000);
} 