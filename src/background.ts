// バックグラウンドスクリプト - サービスワーカー
console.log('画像ダウンローダー拡張機能が起動しました');

// 型定義
interface DownloadRequest {
    type: 'DOWNLOAD_IMAGE';
    imageUrl: string;
    filename?: string;
}

interface SettingsRequest {
    type: 'GET_SETTINGS' | 'SAVE_SETTINGS';
    settings?: any;
}

type MessageRequest = DownloadRequest | SettingsRequest;

interface Settings {
    downloadPath: string;
    autoDownload: boolean;
    fileNaming: string;
}

// 拡張機能のインストール時の処理
chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
    console.log('拡張機能がインストールされました:', details.reason);

    // デフォルト設定を保存
    chrome.storage.sync.set({
        downloadPath: 'images/',
        autoDownload: false,
        fileNaming: 'original'
    });
});

// メッセージリスナー
chrome.runtime.onMessage.addListener((
    request: MessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
) => {
    console.log('メッセージを受信:', request);

    switch (request.type) {
        case 'DOWNLOAD_IMAGE':
            downloadImage(request.imageUrl, request.filename);
            break;
        case 'GET_SETTINGS':
            getSettings().then(sendResponse);
            return true; // 非同期レスポンス
        case 'SAVE_SETTINGS':
            saveSettings(request.settings).then(sendResponse);
            return true; // 非同期レスポンス
        default:
            console.warn('未知のメッセージタイプ:', request.type);
    }
});

// 画像ダウンロード処理
async function downloadImage(imageUrl: string, filename?: string): Promise<void> {
    try {
        const settings = await getSettings();
        const finalFilename = filename || generateFilename(imageUrl);

        chrome.downloads.download({
            url: imageUrl,
            filename: `${settings.downloadPath}${finalFilename}`,
            saveAs: false
        }, (downloadId: number) => {
            if (chrome.runtime.lastError) {
                console.error('ダウンロードエラー:', chrome.runtime.lastError);
            } else {
                console.log('ダウンロード開始:', downloadId);
            }
        });
    } catch (error) {
        console.error('画像ダウンロードエラー:', error);
    }
}

// 設定取得
async function getSettings(): Promise<Settings> {
    return new Promise((resolve) => {
        chrome.storage.sync.get({
            downloadPath: 'images/',
            autoDownload: false,
            fileNaming: 'original'
        }, (items: Settings) => {
            resolve(items);
        });
    });
}

// 設定保存
async function saveSettings(settings: Settings): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.sync.set(settings, () => {
            resolve();
        });
    });
}

// ファイル名生成
function generateFilename(imageUrl: string): string {
    const url = new URL(imageUrl);
    const pathname = url.pathname;
    const filename = pathname.split('/').pop() || 'image.jpg';

    // ファイル名にタイムスタンプを追加
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nameWithoutExt = filename.split('.')[0];
    const ext = filename.split('.').pop() || 'jpg';

    return `${nameWithoutExt}_${timestamp}.${ext}`;
} 