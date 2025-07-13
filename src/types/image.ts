// 画像情報の型定義
export interface ImageInfo {
  src: string;
  alt: string;
  width: number;
  height: number;
  filename: string;
}

// メッセージの型定義
export interface ImageListMessage {
  type: 'GET_IMAGE_LIST';
}

export interface ImageListResponse {
  type: 'IMAGE_LIST_RESPONSE';
  images: ImageInfo[];
}

export interface DownloadSelectedMessage {
  type: 'DOWNLOAD_SELECTED_IMAGES';
  images: ImageInfo[];
  subdirectory?: string;
}
