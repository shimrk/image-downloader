// コンテンツスクリプト - Webページ内で実行
import {
  ImageInfo,
  ImageListMessage,
  ImageListResponse,
  DownloadSelectedMessage,
} from './types/image';

console.log('画像ダウンローダーコンテンツスクリプトが読み込まれました');

// 画像要素の型定義
interface ImageElement extends HTMLImageElement {
  _imageDownloaderProcessed?: boolean;
}

// ページ内の画像を検出してダウンロードボタンを追加
function processImages(): void {
  const images = document.querySelectorAll('img') as NodeListOf<ImageElement>;

  images.forEach(img => {
    if (img._imageDownloaderProcessed) return;

    img._imageDownloaderProcessed = true;

    // 画像にホバー効果を追加
    img.addEventListener('mouseenter', () => {
      showDownloadButton(img);
    });

    img.addEventListener('mouseleave', () => {
      hideDownloadButton(img);
    });
  });
}

// 画像一覧を取得する関数
function getImageList(): ImageInfo[] {
  const images = document.querySelectorAll(
    'img'
  ) as NodeListOf<HTMLImageElement>;
  const imageList: ImageInfo[] = [];

  images.forEach(img => {
    // 無効な画像を除外
    if (!img.src || img.src === '' || img.width === 0 || img.height === 0) {
      return;
    }

    // ファイル名を抽出
    const filename = extractFilename(img.src);

    imageList.push({
      src: img.src,
      alt: img.alt || '',
      width: img.width,
      height: img.height,
      filename: filename,
    });
  });

  return imageList;
}

// URLからファイル名を抽出
function extractFilename(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'image';

    // 拡張子がない場合は.jpgを追加
    if (!filename.includes('.')) {
      return `${filename}.jpg`;
    }

    return filename;
  } catch {
    // URLが無効な場合はデフォルト名を返す
    return 'image.jpg';
  }
}

// メッセージハンドラー
function handleMessage(
  message: ImageListMessage | DownloadSelectedMessage
): ImageListResponse | void {
  switch (message.type) {
    case 'GET_IMAGE_LIST':
      return {
        type: 'IMAGE_LIST_RESPONSE',
        images: getImageList(),
      };
    case 'DOWNLOAD_SELECTED_IMAGES':
      message.images.forEach(imageInfo => {
        downloadImage(imageInfo.src, imageInfo.filename, message.subdirectory);
      });
      break;
  }
}

// ダウンロードボタンを表示
function showDownloadButton(img: ImageElement): void {
  // 既存のボタンを削除
  hideDownloadButton(img);

  const button = document.createElement('button');
  button.textContent = '📥';
  button.title = '画像をダウンロード';
  button.className = 'image-downloader-btn';
  button.style.cssText = `
    position: absolute;
    top: 5px;
    right: 5px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 5px 8px;
    cursor: pointer;
    font-size: 14px;
    z-index: 10000;
    transition: background 0.2s;
  `;

  button.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    downloadImage(img.src, img.alt || 'image');
  });

  // 画像の親要素にボタンを追加
  const container = img.parentElement || document.body;
  container.style.position = 'relative';
  container.appendChild(button);
}

// ダウンロードボタンを非表示
function hideDownloadButton(img: ImageElement): void {
  const existingButton = document.querySelector('.image-downloader-btn');
  if (existingButton) {
    existingButton.remove();
  }
}

// 画像ダウンロード処理
function downloadImage(
  imageUrl: string,
  filename?: string,
  subdirectory?: string
): void {
  console.log('画像ダウンロード要求:', imageUrl);

  // サブディレクトリが指定されている場合はファイル名に追加
  let finalFilename = filename || 'image.jpg';
  if (subdirectory) {
    finalFilename = `${subdirectory}/${finalFilename}`;
  }

  chrome.runtime.sendMessage(
    {
      type: 'DOWNLOAD_IMAGE',
      imageUrl: imageUrl,
      filename: finalFilename,
    },
    response => {
      if (chrome.runtime.lastError) {
        console.error('ダウンロードエラー:', chrome.runtime.lastError);
        showNotification('ダウンロードに失敗しました', 'error');
      } else {
        console.log('ダウンロード成功:', response);
        showNotification('ダウンロードを開始しました', 'success');
      }
    }
  );
}

// 通知表示
function showNotification(message: string, type: 'success' | 'error'): void {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4CAF50' : '#f44336'};
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 10001;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease-out;
  `;

  // アニメーション用のCSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // 3秒後に自動削除
  setTimeout(() => {
    notification.remove();
    style.remove();
  }, 3000);
}

// ページ読み込み完了時に画像を処理
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', processImages);
} else {
  processImages();
}

// 動的に追加される画像にも対応
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        if (element.tagName === 'IMG') {
          processImages();
        } else {
          const images = element.querySelectorAll('img');
          if (images.length > 0) {
            processImages();
          }
        }
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// メッセージリスナーの設定
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const response = handleMessage(message);
  if (response) {
    sendResponse(response);
  }
  return true;
});
