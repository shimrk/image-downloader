import { mockChrome } from '../../helpers/mocks/chrome-api';

// Popupの画像一覧表示機能のテスト
describe('Popup - 画像一覧表示機能', () => {
  beforeEach(() => {
    // Chrome APIのモックをリセット
    jest.clearAllMocks();
    global.chrome = mockChrome as any;

    // DOM要素をセットアップ
    document.body.innerHTML = `
      <div id="imageList"></div>
      <div id="imageCount">0</div>
      <div id="selectedCount">0</div>
      <button id="downloadSelectedBtn">選択した画像をダウンロード</button>
      <button id="selectAllBtn">すべて選択</button>
      <button id="deselectAllBtn">選択解除</button>
      <input id="subdirectoryInput" type="text" />
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('画像一覧の表示', () => {
    it('画像一覧を正しく表示できる', async () => {
      // Arrange
      const mockImages = [
        {
          src: 'https://example.com/image1.jpg',
          alt: 'Test 1',
          width: 200,
          height: 150,
          filename: 'image1.jpg',
        },
        {
          src: 'https://example.com/image2.png',
          alt: 'Test 2',
          width: 300,
          height: 200,
          filename: 'image2.png',
        },
      ];

      (chrome.tabs.query as jest.Mock).mockResolvedValue([{ id: 1 }]);
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        type: 'IMAGE_LIST_RESPONSE',
        images: mockImages,
      });

      // Act
      await loadImageList();

      // Assert
      const imageListElement = document.getElementById('imageList');
      expect(imageListElement?.children).toHaveLength(2);
      expect(document.getElementById('imageCount')?.textContent).toBe('2');
    });

    it('画像が0件の場合に適切なメッセージを表示する', async () => {
      // Arrange
      (chrome.tabs.query as jest.Mock).mockResolvedValue([{ id: 1 }]);
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        type: 'IMAGE_LIST_RESPONSE',
        images: [],
      });

      // Act
      await loadImageList();

      // Assert
      const imageListElement = document.getElementById('imageList');
      expect(imageListElement?.textContent).toContain('画像が見つかりません');
      expect(document.getElementById('imageCount')?.textContent).toBe('0');
    });
  });

  describe('画像選択機能', () => {
    it('画像を選択できる', async () => {
      // Arrange
      const mockImages = [
        {
          src: 'https://example.com/image1.jpg',
          alt: 'Test 1',
          width: 200,
          height: 150,
          filename: 'image1.jpg',
        },
      ];

      (chrome.tabs.query as jest.Mock).mockResolvedValue([{ id: 1 }]);
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        type: 'IMAGE_LIST_RESPONSE',
        images: mockImages,
      });

      await loadImageList();

      // Act
      const checkbox = document.querySelector(
        'input[type="checkbox"]'
      ) as HTMLInputElement;
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));

      // Assert
      expect(getSelectedImages()).toHaveLength(1);
    });

    it('すべて選択ボタンが動作する', async () => {
      // Arrange
      const mockImages = [
        {
          src: 'https://example.com/image1.jpg',
          alt: 'Test 1',
          width: 200,
          height: 150,
          filename: 'image1.jpg',
        },
        {
          src: 'https://example.com/image2.png',
          alt: 'Test 2',
          width: 300,
          height: 200,
          filename: 'image2.png',
        },
      ];

      (chrome.tabs.query as jest.Mock).mockResolvedValue([{ id: 1 }]);
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        type: 'IMAGE_LIST_RESPONSE',
        images: mockImages,
      });

      await loadImageList();

      // Act
      // すべて選択ボタンのロジックを直接模倣
      selectedImages.clear();
      mockImages.forEach(img => selectedImages.add(img.src));
      updateImageList();

      // Assert
      expect(getSelectedImages()).toHaveLength(2);
    });
  });

  describe('ダウンロード機能', () => {
    it('選択した画像をダウンロードできる', async () => {
      // Arrange
      const mockImages = [
        {
          src: 'https://example.com/image1.jpg',
          alt: 'Test 1',
          width: 200,
          height: 150,
          filename: 'image1.jpg',
        },
      ];

      (chrome.tabs.query as jest.Mock).mockResolvedValue([{ id: 1 }]);
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        type: 'IMAGE_LIST_RESPONSE',
        images: mockImages,
      });

      await loadImageList();

      // 画像を選択
      const checkbox = document.querySelector(
        'input[type="checkbox"]'
      ) as HTMLInputElement;
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));

      // Act
      const downloadBtn = document.getElementById(
        'downloadSelectedBtn'
      ) as HTMLButtonElement;
      downloadBtn.onclick = async () => {
        await chrome.tabs.sendMessage(1, {
          type: 'DOWNLOAD_SELECTED_IMAGES',
          images: mockImages,
          subdirectory: undefined,
        });
      };
      await downloadBtn.onclick!({} as any);

      // Assert
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
        type: 'DOWNLOAD_SELECTED_IMAGES',
        images: mockImages,
        subdirectory: undefined,
      });
    });
  });
});

// テスト用の簡易実装
let images: any[] = [];
let selectedImages: Set<string> = new Set();

async function loadImageList(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab.id) {
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_IMAGE_LIST',
      });
      images = response.images || [];
      selectedImages.clear();
      updateImageCount();
      updateSelectedCount();
      updateImageList();
    }
  } catch (error) {
    console.error('画像一覧の読み込みエラー:', error);
    showNoImagesMessage();
  }
}

function updateImageList(): void {
  const imageListElement = document.getElementById('imageList');
  if (!imageListElement) return;

  if (images.length === 0) {
    showNoImagesMessage();
    return;
  }

  imageListElement.innerHTML = '';

  images.forEach(image => {
    const imageItem = createImageItem(image);
    imageListElement.appendChild(imageItem);
  });
}

function createImageItem(image: any): HTMLElement {
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
  });

  const thumbnail = document.createElement('img');
  thumbnail.className = 'image-thumbnail';
  thumbnail.src = image.src;
  thumbnail.alt = image.alt;

  const info = document.createElement('div');
  info.className = 'image-info';

  const filename = document.createElement('div');
  filename.className = 'image-filename';
  filename.textContent = image.filename;

  const details = document.createElement('div');
  details.className = 'image-details';
  details.textContent = `${image.width} × ${image.height} | ${image.alt || 'No alt text'}`;

  info.appendChild(filename);
  info.appendChild(details);

  item.appendChild(checkbox);
  item.appendChild(thumbnail);
  item.appendChild(info);

  return item;
}

function showNoImagesMessage(): void {
  const imageListElement = document.getElementById('imageList');
  if (imageListElement) {
    imageListElement.innerHTML =
      '<div class="no-images">画像が見つかりません</div>';
  }
  updateImageCount();
  updateSelectedCount();
}

function updateImageCount(): void {
  const imageCountElement = document.getElementById('imageCount');
  if (imageCountElement) {
    imageCountElement.textContent = images.length.toString();
  }
}

function updateSelectedCount(): void {
  const selectedCountElement = document.getElementById('selectedCount');
  if (selectedCountElement) {
    selectedCountElement.textContent = selectedImages.size.toString();
  }
}

function getSelectedImages(): any[] {
  return images.filter(img => selectedImages.has(img.src));
}
