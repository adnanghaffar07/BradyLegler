type RingProductInput = {
  productType?: string;
  tags?: string;
  collections?: Array<{ handle?: string }>;
};

export const RING_SIZE_DIAMETERS: Record<string, string> = {
  '4': '⌀ 15.0 mm',
  '4.5': '⌀ 15.3 mm',
  '5': '⌀ 15.6 mm',
  '5.5': '⌀ 16.2 mm',
  '6': '⌀ 16.6 mm',
  '6.5': '⌀ 16.9 mm',
  '7': '⌀ 17.2 mm',
  '7.5': '⌀ 17.8 mm',
  '8': '⌀ 18.1 mm',
  '8.5': '⌀ 18.5 mm',
  '9': '⌀ 19.1 mm',
  '9.5': '⌀ 19.4 mm',
  '10': '⌀ 19.7 mm',
  '10.5': '⌀ 20.4 mm',
  '11': '⌀ 20.7 mm',
  '11.5': '⌀ 21.0 mm',
  '12': '⌀ 21.6 mm',
  '12.5': '⌀ 22.0 mm',
  '13': '⌀ 22.3 mm'
};

export const RING_SIZE_ORDER = Object.keys(RING_SIZE_DIAMETERS);

const RING_COLLECTION_HANDLES = new Set(['ring', 'rings']);

export function getRingDiameter(size: string): string | undefined {
  return RING_SIZE_DIAMETERS[size.trim()];
}

export function isValidRingSize(size: string): boolean {
  return size.trim() in RING_SIZE_DIAMETERS;
}

export function isRingProduct(input: RingProductInput): boolean {
  const productType = input.productType?.toLowerCase() ?? '';
  if (productType.includes('ring')) {
    return true;
  }

  const tags = input.tags?.toLowerCase() ?? '';
  if (/\bring(s)?\b/.test(tags)) {
    return true;
  }

  return (input.collections ?? []).some(collection => {
    const handle = collection.handle?.toLowerCase();
    return handle ? RING_COLLECTION_HANDLES.has(handle) : false;
  });
}

type VariantWithOptions = {
  option1?: string;
  option2?: string;
  option3?: string;
  title?: string;
};

type ProductOption = {
  name: string;
};

export function getVariantRingSize(variant: VariantWithOptions, options: ProductOption[] = []): string | null {
  const sizeOptionIndex = options.findIndex(option => /size/i.test(option.name));

  if (sizeOptionIndex >= 0) {
    const optionValues = [variant.option1, variant.option2, variant.option3];
    const size = optionValues[sizeOptionIndex]?.trim();
    if (size) {
      return size;
    }
  }

  if (options.length === 1) {
    const size = variant.option1?.trim();
    if (size) {
      return size;
    }
  }

  const titleSize = variant.title?.trim();
  return titleSize || null;
}

export function sortRingSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => RING_SIZE_ORDER.indexOf(a) - RING_SIZE_ORDER.indexOf(b));
}

export function compareRingVariants<T extends VariantWithOptions>(
  a: T,
  b: T,
  options: ProductOption[] = []
): number {
  const sizeA = Number.parseFloat(getVariantRingSize(a, options) ?? '0');
  const sizeB = Number.parseFloat(getVariantRingSize(b, options) ?? '0');

  return sizeA - sizeB;
}
