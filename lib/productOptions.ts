type ProductOption = {
  name: string;
  values: string[];
};

type VariantOptionValues = {
  option1?: string;
  option2?: string;
  option3?: string;
};

const normalize = (value?: string) => value?.trim().toLowerCase() ?? '';

export function isDefaultTitleOption(name: string, values: string[] = []): boolean {
  if (normalize(name) !== 'title') {
    return false;
  }

  if (values.length === 0) {
    return true;
  }

  return values.every(value => normalize(value) === 'default title');
}

export function isDefaultTitleValue(value?: string): boolean {
  return normalize(value) === 'default title';
}

export function getSelectableOptions(options: ProductOption[] = []): ProductOption[] {
  return options
    .filter(option => option.values?.length > 0)
    .filter(option => !isDefaultTitleOption(option.name, option.values))
    .map(option => ({
      name: option.name,
      values: option.values.filter(value => !isDefaultTitleValue(value))
    }))
    .filter(option => option.values.length > 0);
}

export function getVariantOptionSignature(
  variant: VariantOptionValues,
  allOptions: ProductOption[],
  selectableOptions: ProductOption[]
): string {
  const optionValues = [variant.option1, variant.option2, variant.option3];

  return selectableOptions
    .map(selectableOption => {
      const index = allOptions.findIndex(option => option.name === selectableOption.name);
      return `${selectableOption.name}:${optionValues[index] ?? ''}`;
    })
    .join('|');
}

export function hasMeaningfulVariantChoices(
  variants: VariantOptionValues[],
  options: ProductOption[] = []
): boolean {
  const selectableOptions = getSelectableOptions(options);

  if (selectableOptions.length === 0) {
    return false;
  }

  const uniqueCombinations = new Set(
    variants.map(variant => getVariantOptionSignature(variant, options, selectableOptions))
  );

  return uniqueCombinations.size > 1;
}
