// 設定の型定義
export interface Settings {
  downloadPath: string;
  fileNaming: 'original' | 'timestamp' | 'sequential' | 'template';
  autoDownload: boolean;
  showNotifications: boolean;
  // テンプレート指定（fileNaming が 'template' の場合に使用）
  fileNameTemplate?: string;
}

// メッセージの型定義
export interface DownloadRequest {
  type: 'DOWNLOAD_IMAGE';
  imageUrl: string;
  filename?: string;
}

export interface SettingsRequest {
  type: 'GET_SETTINGS' | 'SAVE_SETTINGS';
  settings?: Settings;
}

export type MessageRequest = DownloadRequest | SettingsRequest;
