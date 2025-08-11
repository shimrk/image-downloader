import { ImageInfo } from '../../../src/types/image';
import {
  getExtension,
  filterImages,
  sortImages,
  getFilteredSortedImages,
  ImageFilters,
  ImageSortOption,
} from '../../../src/utils/imageFilter';

describe('imageFilter utilities', () => {
  const images: ImageInfo[] = [
    {
      src: 'https://a/img1.jpg',
      alt: '',
      width: 100,
      height: 100,
      filename: 'img1.jpg',
    },
    {
      src: 'https://a/img2.png',
      alt: '',
      width: 300,
      height: 200,
      filename: 'img2.png',
    },
    {
      src: 'https://a/img3.webp?x=1',
      alt: '',
      width: 50,
      height: 50,
      filename: 'img3.webp',
    },
    {
      src: 'https://a/noext?id=1',
      alt: '',
      width: 400,
      height: 100,
      filename: 'noext',
    },
    {
      src: 'https://a/img4.SVG',
      alt: '',
      width: 10,
      height: 10,
      filename: 'img4.SVG',
    },
  ];

  it('getExtension parses extension from filename/url', () => {
    expect(getExtension(images[0])).toBe('jpg');
    expect(getExtension(images[1])).toBe('png');
    expect(getExtension(images[2])).toBe('webp');
    expect(getExtension(images[3])).toBe('');
    expect(getExtension(images[4])).toBe('svg');
  });

  it('filterImages by min size and extensions', () => {
    const filters: ImageFilters = {
      minWidth: 100,
      minHeight: 100,
      extensions: new Set(['jpg', 'png']),
    };
    const result = filterImages(images, filters);
    expect(result.map(i => i.filename)).toEqual(['img1.jpg', 'img2.png']);
  });

  it('sortImages by area desc then filename', () => {
    const option: ImageSortOption = { key: 'area', order: 'desc' };
    const result = sortImages(images, option);
    const names = result.map(i => i.filename);
    expect(names[0]).toBe('img2.png'); // 300*200
  });

  it('sortImages by filename with natural order', () => {
    const targets: ImageInfo[] = [
      { src: '1.png', alt: '', width: 1, height: 1, filename: '1.png' },
      { src: '10.png', alt: '', width: 1, height: 1, filename: '10.png' },
      { src: '2.png', alt: '', width: 1, height: 1, filename: '2.png' },
      { src: '100.png', alt: '', width: 1, height: 1, filename: '100.png' },
    ];
    const resultAsc = sortImages(targets, { key: 'filename', order: 'asc' });
    expect(resultAsc.map(i => i.filename)).toEqual([
      '1.png',
      '2.png',
      '10.png',
      '100.png',
    ]);

    const resultDesc = sortImages(targets, { key: 'filename', order: 'desc' });
    expect(resultDesc.map(i => i.filename)).toEqual([
      '100.png',
      '10.png',
      '2.png',
      '1.png',
    ]);
  });
  it('getFilteredSortedImages integrates filtering and sorting', () => {
    const filters: ImageFilters = {
      minWidth: 50,
      minHeight: 50,
      extensions: new Set(['', 'jpg', 'png', 'webp', 'svg']),
    };
    const option: ImageSortOption = { key: 'width', order: 'asc' };
    const result = getFilteredSortedImages(images, filters, option);
    expect(result[0].width).toBe(50);
    expect(result[result.length - 1].width).toBe(400);
  });
});
