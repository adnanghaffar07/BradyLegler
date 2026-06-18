type SizeGuideTable = {
  _key?: string;
  title: string;
  collections?: Array<{
    store?: {
      gid: string;
    };
  }>;
  Table: {
    rows: {
      _key: string;
      cells: string[];
    }[];
  };
};

export function getFilteredSizeGuideTables(
  tables: SizeGuideTable[] = [],
  productCollectionIds: string[] = []
): SizeGuideTable[] {
  return tables.filter(table => {
    const collectionIds = (table.collections || []).map(collection => collection.store?.gid).filter(Boolean);
    return collectionIds.some(id => productCollectionIds.includes(id as string));
  });
}
