'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { GetCollectionByHandleSortBy } from '@/tools/apis/shopify';
import { setCollectionFiltersChangedProperty } from '../../helpers';
import styles from './styles.module.scss';

const SortByDropdown = () => {
  const [value, setValue] = useState<GetCollectionByHandleSortBy>('best-selling');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Set dropdown value based on URL
  useEffect(() => {
    const existingSortByValue = searchParams.get('sort_by') as GetCollectionByHandleSortBy;
    if (existingSortByValue && existingSortByValue !== value) {
      setValue(searchParams.get('sort_by') as GetCollectionByHandleSortBy);
    }
  }, [searchParams]);

  // Update URL when dropdown changes
  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sortBy = e.target.value as GetCollectionByHandleSortBy;
    const params = new URLSearchParams(searchParams);
    params.set('sort_by', sortBy);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setCollectionFiltersChangedProperty(true);
  };

  return (
    <select className={styles.select} onChange={onChange} value={value}>
      <option value="manual">Featured</option>
      <option value="best-selling">Most popular</option>
      <option value="title-ascending">Alphabetically, A-Z</option>
      <option value="title-descending">Alphabetically, Z-A</option>
      <option value="price-ascending">Price, low to high</option>
      <option value="price-descending">Price, high to low</option>
      <option value="created-ascending">Date, old to new</option>
      <option value="created-descending">Date, new to old</option>
    </select>
  );
};

export default SortByDropdown;
