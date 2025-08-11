// ポップアップ画面のスクリプト
import { ImageInfo } from './types/image';
import {
  getFilteredSortedImages,
  getExtension,
  ImageFilters,
  ImageSortOption,
} from './utils/imageFilter';

console.log('ポップアップ画面が読み込まれました');

// DOM要素の取得
const imageCountElement = document.getElementById('imageCount') as HTMLElement;
const selectedCountElement = document.getElementById(
  'selectedCount'
) as HTMLElement;
const downloadSelectedBtn = document.getElementById(
  'downloadSelectedBtn'
) as HTMLButtonElement;
const scanImagesBtn = document.getElementById(
  'scanImagesBtn'
) as HTMLButtonElement;
const selectAllBtn = document.getElementById(
  'selectAllBtn'
) as HTMLButtonElement;
const deselectAllBtn = document.getElementById(
  'deselectAllBtn'
) as HTMLButtonElement;
const imageListElement = document.getElementById('imageList') as HTMLElement;
const subdirectoryInput = document.getElementById(
  'subdirectoryInput'
) as HTMLInputElement;
// フィルタ/ソート UI
const minWidthInput = document.getElementById(
  'minWidthInput'
) as HTMLInputElement | null;
const minHeightInput = document.getElementById(
  'minHeightInput'
) as HTMLInputElement | null;
const sortKeySelect = document.getElementById(
  'sortKeySelect'
) as HTMLSelectElement | null;
const sortOrderSelect = document.getElementById(
  'sortOrderSelect'
) as HTMLSelectElement | null;
const clearFiltersBtn = document.getElementById(
  'clearFiltersBtn'
) as HTMLButtonElement | null;

// 状態管理
let images: ImageInfo[] = [];
let selectedImages: Set<string> = new Set();

// フィルタ/ソート状態
let filters: ImageFilters = {
  minWidth: 0,
  minHeight: 0,
  extensions: new Set<string>(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', '']),
};

let sortOption: ImageSortOption = {
  key: 'area',
  order: 'desc',
};

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('ポップアップ画面の初期化開始');

  // イベントリスナーの設定
  setupEventListeners();

  // 画像一覧を読み込み
  await loadImageList();

  // バッジ初期更新（念のため）
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'GET_IMAGE_LIST' }, response => {
        if (response?.images) {
          chrome.runtime.sendMessage({
            type: 'UPDATE_BADGE',
            count: response.images.length,
          });
        }
      });
    }
  } catch {}
});

// イベントリスナーの設定
function setupEventListeners(): void {
  // 選択した画像をダウンロード
  downloadSelectedBtn.addEventListener('click', async () => {
    console.log('選択した画像をダウンロード');

    const selectedImageList = getSelectedImages();
    if (selectedImageList.length === 0) {
      showMessage('選択された画像がありません', 'error');
      return;
    }

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab.id) {
      const subdirectory = subdirectoryInput.value.trim();
      chrome.tabs.sendMessage(
        tab.id,
        {
          type: 'DOWNLOAD_SELECTED_IMAGES',
          images: selectedImageList,
          subdirectory: subdirectory || undefined,
        },
        response => {
          if (chrome.runtime.lastError) {
            showMessage('エラー: ページを再読み込みしてください', 'error');
          } else {
            showMessage(
              `${selectedImageList.length}個の画像をダウンロードしました`,
              'success'
            );
            // 選択をクリア
            selectedImages.clear();
            updateSelectedCount();
            updateImageList();
          }
        }
      );
    }
  });

  // 画像を再スキャン
  scanImagesBtn.addEventListener('click', async () => {
    console.log('画像を再スキャン');

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'GET_IMAGE_LIST' }, response => {
        if (chrome.runtime.lastError) {
          showMessage('エラー: ページを再読み込みしてください', 'error');
        } else {
          images = response.images || [];
          selectedImages.clear();
          updateImageCount();
          updateSelectedCount();
          updateImageList();
          showMessage(`${images.length}個の画像を検出しました`, 'success');
        }
      });
    }
  });

  // すべて選択
  selectAllBtn.addEventListener('click', () => {
    selectedImages.clear();
    images.forEach(img => selectedImages.add(img.src));
    updateSelectedCount();
    updateImageList();
  });

  // 選択解除
  deselectAllBtn.addEventListener('click', () => {
    selectedImages.clear();
    updateSelectedCount();
    updateImageList();
  });

  // フィルタ/ソートイベント
  const onFilterChange = debounce(() => {
    // 数値入力
    if (minWidthInput)
      filters.minWidth = clampNonNegativeInt(minWidthInput.value);
    if (minHeightInput)
      filters.minHeight = clampNonNegativeInt(minHeightInput.value);

    // 拡張子
    const checkboxes = Array.from(
      document.querySelectorAll<HTMLInputElement>('input.ext-checkbox')
    );
    const next = new Set<string>();
    checkboxes.forEach(cb => {
      if (cb.checked) next.add(cb.value.toLowerCase());
    });
    filters.extensions = next;

    // ソート
    if (sortKeySelect)
      sortOption.key = sortKeySelect.value as ImageSortOption['key'];
    if (sortOrderSelect)
      sortOption.order = sortOrderSelect.value as ImageSortOption['order'];

    updateImageList();
  }, 120);

  minWidthInput?.addEventListener('input', onFilterChange);
  minHeightInput?.addEventListener('input', onFilterChange);
  sortKeySelect?.addEventListener('change', onFilterChange);
  sortOrderSelect?.addEventListener('change', onFilterChange);
  document
    .querySelectorAll<HTMLInputElement>('input.ext-checkbox')
    .forEach(cb => cb.addEventListener('change', onFilterChange));

  clearFiltersBtn?.addEventListener('click', () => {
    if (minWidthInput) minWidthInput.value = '';
    if (minHeightInput) minHeightInput.value = '';
    if (sortKeySelect) sortKeySelect.value = 'area';
    if (sortOrderSelect) sortOrderSelect.value = 'desc';
    document
      .querySelectorAll<HTMLInputElement>('input.ext-checkbox')
      .forEach(cb => (cb.checked = true));

    filters = {
      minWidth: 0,
      minHeight: 0,
      extensions: new Set<string>([
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
        'svg',
        '',
      ]),
    };
    sortOption = { key: 'area', order: 'desc' };
    updateImageList();
  });
}

// 画像一覧を読み込み
async function loadImageList(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'GET_IMAGE_LIST' }, response => {
        if (chrome.runtime.lastError) {
          console.log('コンテンツスクリプトが読み込まれていません');
          showNoImagesMessage();
        } else {
          images = response.images || [];
          updateImageCount();
          updateSelectedCount();
          updateImageList();
          chrome.runtime.sendMessage({
            type: 'UPDATE_BADGE',
            count: images.length,
          });
        }
      });
    }
  } catch (error) {
    console.error('画像一覧の読み込みエラー:', error);
    showNoImagesMessage();
  }
}

// 画像一覧を更新
function updateImageList(): void {
  if (images.length === 0) {
    showNoImagesMessage();
    return;
  }

  imageListElement.innerHTML = '';

  const displayList = getFilteredSortedImages(images, filters, sortOption);

  displayList.forEach(image => {
    const imageItem = createImageItem(image);
    imageListElement.appendChild(imageItem);
  });
}

// 画像アイテムを作成
function createImageItem(image: ImageInfo): HTMLElement {
  const item = document.createElement('div');
  item.className = 'image-item';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'image-checkbox';
  checkbox.checked = selectedImages.has(image.src);
  checkbox.addEventListener('change', e => {
    const target = e.target as HTMLInputElement;
    if (target.checked) {
      selectedImages.add(image.src);
    } else {
      selectedImages.delete(image.src);
    }
    updateSelectedCount();
    updateDownloadButton();
    // 見た目のハイライト
    item.classList.toggle('selected', target.checked);
  });

  const thumbnail = document.createElement('img');
  thumbnail.className = 'image-thumbnail';
  thumbnail.src = image.src;
  thumbnail.alt = image.alt;
  thumbnail.onerror = () => {
    thumbnail.style.display = 'none';
  };

  const info = document.createElement('div');
  info.className = 'image-info';

  const filename = document.createElement('div');
  filename.className = 'image-filename';
  filename.textContent = image.filename;

  const details = document.createElement('div');
  details.className = 'image-details';
  const ext = getExtension(image) || 'other';
  details.textContent = `${image.width} × ${image.height} | .${ext} | ${image.alt || 'No alt text'}`;

  info.appendChild(filename);
  info.appendChild(details);

  item.appendChild(checkbox);
  item.appendChild(thumbnail);
  item.appendChild(info);

  // カード全体クリックでトグル
  item.addEventListener('click', e => {
    // チェックボックス自体のクリックは二重反応させない
    if ((e.target as HTMLElement).classList.contains('image-checkbox')) {
      return;
    }
    const nowChecked = !checkbox.checked;
    checkbox.checked = nowChecked;
    if (nowChecked) {
      selectedImages.add(image.src);
    } else {
      selectedImages.delete(image.src);
    }
    item.classList.toggle('selected', nowChecked);
    updateSelectedCount();
    updateDownloadButton();
  });

  return item;
}

// 画像が見つからない場合のメッセージを表示
function showNoImagesMessage(): void {
  imageListElement.innerHTML =
    '<div class="no-images">画像が見つかりません</div>';
  updateImageCount();
  updateSelectedCount();
}

// 統計情報の更新
function updateImageCount(): void {
  imageCountElement.textContent = images.length.toString();
}

function updateSelectedCount(): void {
  selectedCountElement.textContent = selectedImages.size.toString();
  updateDownloadButton();
}

// ダウンロードボタンの有効/無効を切り替え
function updateDownloadButton(): void {
  downloadSelectedBtn.disabled = selectedImages.size === 0;
}

// 選択された画像を取得
function getSelectedImages(): ImageInfo[] {
  return images.filter(img => selectedImages.has(img.src));
}

// ユーティリティ
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: number | undefined;
  return ((...args: any[]) => {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), ms);
  }) as T;
}

function clampNonNegativeInt(value: string): number {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 0) return 0;
  return n;
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
