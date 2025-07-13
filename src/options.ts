// 設定画面のスクリプト
import { Settings } from './types/settings';

console.log('設定画面が読み込まれました');

// DOM要素の取得
const downloadPathInput = document.getElementById(
  'downloadPath'
) as HTMLInputElement;
const fileNamingSelect = document.getElementById(
  'fileNaming'
) as HTMLSelectElement;
const autoDownloadCheckbox = document.getElementById(
  'autoDownload'
) as HTMLInputElement;
const showNotificationsCheckbox = document.getElementById(
  'showNotifications'
) as HTMLInputElement;
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
const statusElement = document.getElementById('status') as HTMLElement;

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('設定画面の初期化開始');

  // 保存された設定を読み込み
  await loadSettings();

  // イベントリスナーの設定
  setupEventListeners();
});

// イベントリスナーの設定
function setupEventListeners(): void {
  // 設定を保存
  saveBtn.addEventListener('click', async () => {
    console.log('設定を保存');
    await saveSettings();
  });

  // 設定をリセット
  resetBtn.addEventListener('click', async () => {
    console.log('設定をリセット');
    await resetSettings();
  });

  // 入力値の変更を監視
  downloadPathInput.addEventListener('input', () => {
    showStatus('設定が変更されました。保存してください。', 'info');
  });

  fileNamingSelect.addEventListener('change', () => {
    showStatus('設定が変更されました。保存してください。', 'info');
  });

  autoDownloadCheckbox.addEventListener('change', () => {
    showStatus('設定が変更されました。保存してください。', 'info');
  });

  showNotificationsCheckbox.addEventListener('change', () => {
    showStatus('設定が変更されました。保存してください。', 'info');
  });
}

// 設定を読み込み
async function loadSettings(): Promise<void> {
  try {
    const settings = await getStoredSettings();

    // フォームに値を設定
    downloadPathInput.value = settings.downloadPath;
    fileNamingSelect.value = settings.fileNaming;
    autoDownloadCheckbox.checked = settings.autoDownload;
    showNotificationsCheckbox.checked = settings.showNotifications;

    console.log('設定を読み込みました:', settings);
  } catch (error) {
    console.error('設定の読み込みに失敗:', error);
    showStatus('設定の読み込みに失敗しました', 'error');
  }
}

// 設定を保存
async function saveSettings(): Promise<void> {
  try {
    const settings: Settings = {
      downloadPath: downloadPathInput.value.trim() || 'images/',
      fileNaming: fileNamingSelect.value as Settings['fileNaming'],
      autoDownload: autoDownloadCheckbox.checked,
      showNotifications: showNotificationsCheckbox.checked,
    };

    // バリデーション
    if (!validateSettings(settings)) {
      return;
    }

    // 設定を保存
    await chrome.storage.sync.set(settings);

    console.log('設定を保存しました:', settings);
    showStatus('設定を保存しました！', 'success');

    // 3秒後にステータスをクリア
    setTimeout(() => {
      hideStatus();
    }, 3000);
  } catch (error) {
    console.error('設定の保存に失敗:', error);
    showStatus('設定の保存に失敗しました', 'error');
  }
}

// 設定をリセット
async function resetSettings(): Promise<void> {
  try {
    const defaultSettings: Settings = {
      downloadPath: 'images/',
      fileNaming: 'original',
      autoDownload: false,
      showNotifications: true,
    };

    // デフォルト設定を保存
    await chrome.storage.sync.set(defaultSettings);

    // フォームを更新
    downloadPathInput.value = defaultSettings.downloadPath;
    fileNamingSelect.value = defaultSettings.fileNaming;
    autoDownloadCheckbox.checked = defaultSettings.autoDownload;
    showNotificationsCheckbox.checked = defaultSettings.showNotifications;

    console.log('設定をリセットしました:', defaultSettings);
    showStatus('設定をリセットしました！', 'success');

    // 3秒後にステータスをクリア
    setTimeout(() => {
      hideStatus();
    }, 3000);
  } catch (error) {
    console.error('設定のリセットに失敗:', error);
    showStatus('設定のリセットに失敗しました', 'error');
  }
}

// 保存された設定を取得
async function getStoredSettings(): Promise<Settings> {
  return new Promise(resolve => {
    const defaultSettings: Settings = {
      downloadPath: 'images/',
      fileNaming: 'original',
      autoDownload: false,
      showNotifications: true,
    };

    chrome.storage.sync.get(defaultSettings, (items: any) => {
      resolve(items as Settings);
    });
  });
}

// 設定のバリデーション
function validateSettings(settings: Settings): boolean {
  // ダウンロードパスのバリデーション
  if (
    settings.downloadPath.includes('..') ||
    settings.downloadPath.includes('\\')
  ) {
    showStatus('無効なダウンロードパスです', 'error');
    return false;
  }

  // パスの末尾にスラッシュを追加
  if (!settings.downloadPath.endsWith('/')) {
    settings.downloadPath += '/';
  }

  return true;
}

// ステータス表示
function showStatus(message: string, type: 'success' | 'error' | 'info'): void {
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
  statusElement.style.display = 'block';
}

// ステータス非表示
function hideStatus(): void {
  statusElement.style.display = 'none';
}
