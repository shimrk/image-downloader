// テスト用ユーティリティ関数

// モック画像要素を作成
export const createMockImage = (
  src: string,
  alt: string = '',
  width: number = 100,
  height: number = 100
) => {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.width = width;
  img.height = height;
  return img;
};

// ダウンロード完了を待機
export const waitForDownload = (timeout = 5000) => {
  return new Promise(resolve => setTimeout(resolve, timeout));
};

// DOM要素をクリーンアップ
export const cleanupDOM = () => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
};

// テスト用の画像データ
export const testImages = {
  valid: [
    {
      src: 'https://example.com/image1.jpg',
      alt: 'Test Image 1',
      width: 200,
      height: 150,
    },
    {
      src: 'https://example.com/image2.png',
      alt: 'Test Image 2',
      width: 300,
      height: 200,
    },
    {
      src: 'https://example.com/image3.gif',
      alt: 'Test Image 3',
      width: 150,
      height: 100,
    },
  ],
  invalid: [
    {
      src: 'https://example.com/nonexistent.jpg',
      alt: 'Invalid Image',
      width: 0,
      height: 0,
    },
    { src: 'invalid-url', alt: 'Invalid URL', width: 0, height: 0 },
  ],
};
