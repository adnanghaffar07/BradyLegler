type UnknownRecord = Record<string, unknown>;

const IMAGE_KEYS = [
  'openGraphImage',
  'image',
  'images',
  'featuredImage',
  'heroImage',
  'desktopImage',
  'mobileImage',
  'thumbnail',
  'gallery',
  'media',
  'mediaItems'
];

const isRecord = (value: unknown): value is UnknownRecord => {
  return typeof value === 'object' && value !== null;
};

const getImageUrlFromValue = (value: unknown): string | undefined => {
  if (!value) return undefined;

  if (Array.isArray(value)) {
    for (const item of value) {
      const url = getImageUrlFromValue(item);
      if (url) return url;
    }
    return undefined;
  }

  if (typeof value === 'string') {
    return value.startsWith('http') ? value : undefined;
  }

  if (!isRecord(value)) return undefined;

  const directUrl = value?.asset && isRecord(value.asset) ? value.asset?.url : undefined;
  if (typeof directUrl === 'string' && directUrl.length > 0) return directUrl;

  const sourceUrl = value?.src;
  if (typeof sourceUrl === 'string' && sourceUrl.startsWith('http')) return sourceUrl;

  for (const key of IMAGE_KEYS) {
    const nested = getImageUrlFromValue(value[key]);
    if (nested) return nested;
  }

  for (const nestedValue of Object.values(value)) {
    const nested = getImageUrlFromValue(nestedValue);
    if (nested) return nested;
  }

  return undefined;
};

const resolveShareImage = (...candidates: unknown[]): string | undefined => {
  for (const candidate of candidates) {
    const url = getImageUrlFromValue(candidate);
    if (url) return url;
  }
  return undefined;
};

export default resolveShareImage;
