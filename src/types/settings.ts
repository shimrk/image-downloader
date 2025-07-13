// 設定の型定義
export interface Settings {
  downloadPath: string;
  fileNaming: 'original' | 'timestamp' | 'sequential';
  autoDownload: boolean;
  showNotifications: boolean;
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
