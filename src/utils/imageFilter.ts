// フィルタ/ソートのユーティリティ
import { ImageInfo } from '../types/image';

export type SortKey = 'area' | 'width' | 'height' | 'filename';
export type SortOrder = 'asc' | 'desc';

export interface ImageFilters {
  minWidth: number;
  minHeight: number;
  extensions: Set<string>; // 小文字拡張子（例: jpg, jpeg, png, gif, webp, svg, other(空文字))
}

export interface ImageSortOption {
  key: SortKey;
  order: SortOrder;
}

export function getExtension(image: ImageInfo): string {
  const url = image.src || '';
  const fromFilename = (image.filename || '').split('?')[0];
  const fname = fromFilename || url.split('/').pop() || '';
  const dotIdx = fname.lastIndexOf('.');
  if (dotIdx === -1) return '';
  return fname.substring(dotIdx + 1).toLowerCase();
}

export function filterImages(
  images: ImageInfo[],
  filters: ImageFilters
): ImageInfo[] {
  const { minWidth, minHeight, extensions } = filters;
  return images.filter(img => {
    const meetsSize =
      (img.width || 0) >= minWidth && (img.height || 0) >= minHeight;
    const ext = getExtension(img);
    const normalizedExt = ext || '';
    const allowed =
      extensions.size === 0 ||
      extensions.has(normalizedExt) ||
      (normalizedExt === '' && extensions.has('other'));
    return meetsSize && allowed;
  });
}

export function sortImages(
  images: ImageInfo[],
  option: ImageSortOption
): ImageInfo[] {
  const { key, order } = option;
  const factor = order === 'asc' ? 1 : -1;
  const compareName = createNaturalFilenameComparator();
  return [...images].sort((a, b) => {
    let va = 0;
    let vb = 0;
    switch (key) {
      case 'area':
        va = (a.width || 0) * (a.height || 0);
        vb = (b.width || 0) * (b.height || 0);
        break;
      case 'width':
        va = a.width || 0;
        vb = b.width || 0;
        break;
      case 'height':
        va = a.height || 0;
        vb = b.height || 0;
        break;
      case 'filename':
        return factor * compareName(a.filename || '', b.filename || '');
    }
    if (va === vb) {
      // セカンダリキー: ファイル名で安定化
      return factor * compareName(a.filename || '', b.filename || '');
    }
    return factor * (va - vb);
  });
}

export function getFilteredSortedImages(
  images: ImageInfo[],
  filters: ImageFilters,
  sortOption: ImageSortOption
): ImageInfo[] {
  const filtered = filterImages(images, filters);
  return sortImages(filtered, sortOption);
}

// 自然順（数値優先）でのファイル名比較
function createNaturalFilenameComparator(): (a: string, b: string) => number {
  const collator =
    typeof Intl !== 'undefined' && typeof Intl.Collator !== 'undefined'
      ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
      : null;

  if (collator) {
    return (a: string, b: string) => collator.compare(a, b);
  }

  // フォールバック: 数字と非数字で分割して比較
  return (a: string, b: string) => {
    const ax = a.split(/(\d+)/).filter(Boolean);
    const bx = b.split(/(\d+)/).filter(Boolean);
    const len = Math.max(ax.length, bx.length);
    for (let i = 0; i < len; i++) {
      const as = ax[i] ?? '';
      const bs = bx[i] ?? '';
      const an = as.match(/^\d+$/) ? parseInt(as, 10) : NaN;
      const bn = bs.match(/^\d+$/) ? parseInt(bs, 10) : NaN;
      if (!Number.isNaN(an) && !Number.isNaN(bn)) {
        if (an !== bn) return an - bn;
      } else {
        const cmp = as.localeCompare(bs);
        if (cmp !== 0) return cmp;
      }
    }
    return 0;
  };
}
