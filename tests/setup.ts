// テスト環境のセットアップ
import { mockChrome } from './helpers/mocks/chrome-api';

// Chrome APIのモックをグローバルに設定
global.chrome = mockChrome as any;

// DOM環境のセットアップ
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
