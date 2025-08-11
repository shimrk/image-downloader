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

    // バッジ背景色を初期設定
    try {
      chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
    } catch (e) {
      // 環境差による未対応は無視
    }
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
      downloadImage(request.imageUrl, request.filename, sender.tab)
        .then(downloadId => {
          sendResponse({ ok: true, downloadId });
        })
        .catch(error => {
          const message =
            error && (error as any).message
              ? (error as any).message
              : 'unknown_error';
          sendResponse({ ok: false, error: message });
        });
      return true; // 非同期レスポンス
    } else if (request.type === 'GET_SETTINGS') {
      getSettings().then(sendResponse);
      return true; // 非同期レスポンス
    } else if (request.type === 'SAVE_SETTINGS') {
      if (request.settings) {
        saveSettings(request.settings).then(sendResponse);
        return true; // 非同期レスポンス
      }
    } else if ((request as any).type === 'UPDATE_BADGE') {
      const count: number = (request as any).count ?? 0;
      const tabId = sender.tab?.id;
      if (typeof tabId === 'number') {
        const text = count > 999 ? '999+' : count > 0 ? String(count) : '';
        try {
          chrome.action.setBadgeText({ text, tabId });
        } catch (e) {
          // 無視
        }
      }
    } else {
      console.warn('未知のメッセージタイプ:', request);
    }
  }
);

// 画像ダウンロード処理
async function downloadImage(
  imageUrl: string,
  filename?: string,
  tab?: chrome.tabs.Tab
): Promise<number> {
  const settings = await getSettings();
  const finalFilename = await resolveFilename({
    imageUrl,
    providedFilename: filename,
    settings,
    tab,
  });

  return new Promise<number>((resolve, reject) => {
    try {
      chrome.downloads.download(
        {
          url: imageUrl,
          filename: `${settings.downloadPath}${finalFilename}`,
          saveAs: false,
        },
        (downloadId?: number) => {
          if (chrome.runtime.lastError) {
            console.error('ダウンロードエラー:', chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
          } else if (typeof downloadId === 'number') {
            console.log('ダウンロード開始:', downloadId);
            resolve(downloadId);
          } else {
            reject(new Error('failed_to_start_download'));
          }
        }
      );
    } catch (e) {
      reject(e as Error);
    }
  });
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
function extractNameAndExt(imageUrl: string): { name: string; ext: string } {
  try {
    const u = new URL(imageUrl);
    const leaf = (u.pathname.split('/').pop() || 'image').trim();
    if (leaf.includes('.')) {
      const idx = leaf.lastIndexOf('.');
      const name = leaf.slice(0, idx) || 'image';
      const ext = leaf.slice(idx + 1) || 'jpg';
      return { name, ext };
    }
    return { name: leaf || 'image', ext: 'jpg' };
  } catch {
    return { name: 'image', ext: 'jpg' };
  }
}

async function resolveFilename(args: {
  imageUrl: string;
  providedFilename?: string;
  settings: Settings;
  tab?: chrome.tabs.Tab;
}): Promise<string> {
  const { imageUrl, providedFilename, settings, tab } = args;

  // original: 呼び出し側が与えたファイル名を優先
  if (settings.fileNaming === 'original') {
    if (providedFilename) return providedFilename;
    const { name, ext } = extractNameAndExt(imageUrl);
    return `${name}.${ext}`;
  }

  const now = new Date();
  const pad = (n: number, w = 2) => n.toString().padStart(w, '0');
  const timestamp = now
    .toISOString()
    .replace('T', '_')
    .replace(/[:.]/g, '-')
    .replace('Z', '');

  if (settings.fileNaming === 'timestamp') {
    const { name, ext } = extractNameAndExt(imageUrl);
    return `${name}_${timestamp}.${ext}`;
  }

  if (settings.fileNaming === 'sequential') {
    const seq = await nextSequenceNumber();
    const { name, ext } = extractNameAndExt(imageUrl);
    return `${name}_${seq.toString().padStart(3, '0')}.${ext}`;
  }

  if (settings.fileNaming === 'template' && settings.fileNameTemplate) {
    const { name, ext } = extractNameAndExt(imageUrl);
    const pageUrl = tab?.url ? safeUrl(tab.url) : safeUrl(imageUrl);
    const pageTitle = (tab?.title || '').trim();
    const seqNum = await nextSequenceNumber();
    const ctx = buildTemplateContext({
      imageUrl,
      pageUrl,
      pageTitle,
      name,
      ext,
      now,
    });
    // まず {seq:n} を実シーケンスで解決
    const withSeq = settings.fileNameTemplate.replace(
      /\{seq:(\d+)\}/g,
      (_m, w) => String(seqNum).padStart(Number(w), '0')
    );
    const raw = applyFilenameTemplate(withSeq, ctx);
    return sanitizePath(raw || `${name}_${timestamp}.${ext}`);
  }

  // フォールバック
  const { name, ext } = extractNameAndExt(imageUrl);
  return `${name}_${timestamp}.${ext}`;
}

function safeUrl(urlStr: string): URL | null {
  try {
    return new URL(urlStr);
  } catch {
    return null;
  }
}

function buildTemplateContext(args: {
  imageUrl: string;
  pageUrl: URL | null;
  pageTitle: string;
  name: string;
  ext: string;
  now: Date;
}): Record<string, string> {
  const { pageUrl, pageTitle, name, ext, now } = args;
  const pad = (n: number, w = 2) => n.toString().padStart(w, '0');
  const domain = pageUrl?.hostname || '';
  const host = domain;
  const path = pageUrl?.pathname?.replace(/^\//, '') || '';
  const yyyy = now.getFullYear().toString();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const timestamp = Math.floor(now.getTime() / 1000).toString();
  return {
    name,
    ext,
    domain,
    host,
    path,
    title: pageTitle || '',
    yyyy,
    mm,
    dd,
    date: `${yyyy}-${mm}-${dd}`,
    timestamp,
  };
}

function applyFilenameTemplate(
  template: string,
  context: Record<string, string>
): string {
  // {date:YYYY-MM-DD}
  let out = template.replace(/\{date:([^}]+)\}/g, (_m, fmt) => {
    const yyyy = context.yyyy || '';
    const mm = context.mm || '';
    const dd = context.dd || '';
    return fmt.replace(/YYYY/g, yyyy).replace(/MM/g, mm).replace(/DD/g, dd);
  });
  // {seq:3}
  out = out.replace(/\{seq:(\d+)\}/g, (_m, w) => {
    const n = 1; // プレビュー以外では後で置換する設計にもできるが、ここでは固定値
    return String(n).padStart(Number(w), '0');
  });
  // 単純置換
  out = out.replace(
    /\{(name|ext|domain|host|path|title|timestamp|yyyy|mm|dd|date)\}/g,
    (_m, k) => sanitizeSegment(context[k] || '')
  );
  return out;
}

function sanitizeSegment(seg: string): string {
  // Windows禁止: \\ / : * ? " < > | と制御文字を除去
  return seg.replace(/[\\/:*?"<>|\x00-\x1F]/g, '_').trim();
}

function sanitizePath(p: string): string {
  // 先頭の/を除き、連続スラッシュを単一化、.. を除去
  let out = p.replace(/^\/+/, '').replace(/\/+/, '/');
  out = out
    .split('/')
    .filter(part => part !== '' && part !== '.' && part !== '..')
    .map(sanitizeSegment)
    .join('/');
  if (!out) out = 'image.jpg';
  return out;
}

async function nextSequenceNumber(): Promise<number> {
  // セッションストレージに保存
  return new Promise(resolve => {
    chrome.storage.session.get({ __seq: 0 }, items => {
      const current = Number(items.__seq) || 0;
      const next = current + 1;
      chrome.storage.session.set({ __seq: next }, () => resolve(next));
    });
  });
}
