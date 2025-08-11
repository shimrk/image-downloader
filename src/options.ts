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
const templateGroup = document.getElementById('templateGroup') as HTMLElement;
const fileNameTemplateInput = document.getElementById(
  'fileNameTemplate'
) as HTMLInputElement;
const templatePreview = document.getElementById(
  'templatePreview'
) as HTMLElement;
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
    toggleTemplateVisibility();
    updateTemplatePreview();
  });

  autoDownloadCheckbox.addEventListener('change', () => {
    showStatus('設定が変更されました。保存してください。', 'info');
  });

  showNotificationsCheckbox.addEventListener('change', () => {
    showStatus('設定が変更されました。保存してください。', 'info');
  });

  fileNameTemplateInput.addEventListener('input', () => {
    showStatus('設定が変更されました。保存してください。', 'info');
    updateTemplatePreview();
  });
}

// 設定を読み込み
async function loadSettings(): Promise<void> {
  try {
    const settings = await getStoredSettings();

    // フォームに値を設定
    downloadPathInput.value = settings.downloadPath;
    fileNamingSelect.value = settings.fileNaming;
    fileNameTemplateInput.value = settings.fileNameTemplate || '';
    toggleTemplateVisibility();
    updateTemplatePreview();
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
      fileNameTemplate: fileNameTemplateInput.value.trim() || undefined,
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

  // テンプレート選択時の検証
  if (settings.fileNaming === 'template') {
    const tpl = (fileNameTemplateInput.value || '').trim();
    if (!tpl) {
      showStatus('テンプレートが未入力です', 'error');
      return false;
    }
    if (tpl.startsWith('/')) {
      showStatus('テンプレートは先頭に/を含めないでください', 'error');
      return false;
    }
    if (tpl.includes('..')) {
      showStatus('テンプレートに .. は使用できません', 'error');
      return false;
    }
  }

  return true;
}

function toggleTemplateVisibility(): void {
  if (fileNamingSelect.value === 'template') {
    templateGroup.style.display = 'block';
  } else {
    templateGroup.style.display = 'none';
  }
}

function updateTemplatePreview(): void {
  if (fileNamingSelect.value !== 'template') {
    templatePreview.textContent = '';
    return;
  }
  const tpl = fileNameTemplateInput.value || '';
  const example = applyTemplateForPreview(tpl);
  templatePreview.textContent = `プレビュー: ${example || '-'}`;
}

function applyTemplateForPreview(template: string): string {
  if (!template) return '';
  const now = new Date();
  const pad = (n: number, w = 2) => n.toString().padStart(w, '0');
  // ダミー値
  const ctx = {
    name: 'image',
    ext: 'jpg',
    domain: 'example.com',
    host: 'example.com',
    path: 'photos/summer',
    title: 'Sample Page',
    timestamp: Math.floor(now.getTime() / 1000).toString(),
    yyyy: now.getFullYear().toString(),
    mm: pad(now.getMonth() + 1),
    dd: pad(now.getDate()),
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    seq: '001',
  } as Record<string, string>;

  // {date:YYYY-MM-DD} や {seq:3} を簡易対応
  let out = template.replace(/\{date:([^}]+)\}/g, (_m, fmt) => {
    const yyyy = ctx.yyyy;
    const mm = ctx.mm;
    const dd = ctx.dd;
    return fmt.replace(/YYYY/g, yyyy).replace(/MM/g, mm).replace(/DD/g, dd);
  });
  out = out.replace(/\{seq:(\d+)\}/g, (_m, w) => '1'.padStart(Number(w), '0'));
  out = out.replace(
    /\{(name|ext|domain|host|path|title|timestamp|yyyy|mm|dd|date)\}/g,
    (_m, k) => ctx[k] || ''
  );
  return out;
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
