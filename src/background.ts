// バックグラウンドスクリプト - サービスワーカー
import { Settings, MessageRequest } from './types/settings';

console.log('画像ダウンローダー拡張機能が起動しました');

// 拡張機能のインストール時の処理
chrome.runtime.onInstalled.addListener(
  (details: chrome.runtime.InstalledDetails) => {
    console.log('拡張機能がインストールされました:', details.reason);

    // デフォルト設定を保存
    const defaultSettings: Settings = {
      downloadPath: 'images/',
      autoDownload: false,
      fileNaming: 'original',
      showNotifications: true,
    };

    chrome.storage.sync.set(defaultSettings);
  }
);

// メッセージリスナー
chrome.runtime.onMessage.addListener(
  (
    request: MessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    console.log('メッセージを受信:', request);

    if (request.type === 'DOWNLOAD_IMAGE') {
      downloadImage(request.imageUrl, request.filename);
    } else if (request.type === 'GET_SETTINGS') {
      getSettings().then(sendResponse);
      return true; // 非同期レスポンス
    } else if (request.type === 'SAVE_SETTINGS') {
      if (request.settings) {
        saveSettings(request.settings).then(sendResponse);
        return true; // 非同期レスポンス
      }
    } else {
      console.warn('未知のメッセージタイプ:', request);
    }
  }
);

// 画像ダウンロード処理
async function downloadImage(
  imageUrl: string,
  filename?: string
): Promise<void> {
  try {
    const settings = await getSettings();
    const finalFilename = filename || generateFilename(imageUrl);

    chrome.downloads.download(
      {
        url: imageUrl,
        filename: `${settings.downloadPath}${finalFilename}`,
        saveAs: false,
      },
      (downloadId: number) => {
        if (chrome.runtime.lastError) {
          console.error('ダウンロードエラー:', chrome.runtime.lastError);
        } else {
          console.log('ダウンロード開始:', downloadId);
        }
      }
    );
  } catch (error) {
    console.error('画像ダウンロードエラー:', error);
  }
}

// 設定取得
async function getSettings(): Promise<Settings> {
  return new Promise(resolve => {
    const defaultSettings: Settings = {
      downloadPath: 'images/',
      autoDownload: false,
      fileNaming: 'original',
      showNotifications: true,
    };

    chrome.storage.sync.get(defaultSettings, (items: any) => {
      resolve(items as Settings);
    });
  });
}

// 設定保存
async function saveSettings(settings: Settings): Promise<void> {
  return new Promise(resolve => {
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
