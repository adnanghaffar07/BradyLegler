'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import classNames from '@/helpers/classNames';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import {
  GetCollectionFiltersByHandleResponse,
  GetCollectionSubCollectionFiltersByIdResponse
} from '@/tools/apis/shopify';
import styles from './styles.module.scss';

type Props = {
  filters: GetCollectionFiltersByHandleResponse;
  subCollectionFilters: GetCollectionSubCollectionFiltersByIdResponse;
  productCount?: number;
};

const FiltersDrawer: React.FC<Props> = ({ filters, subCollectionFilters, productCount = 0 }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('Filters data:', filters);
    console.log('SubCollection filters:', subCollectionFilters);
    console.log('Search params:', searchParams?.toString());
  }, [filters, subCollectionFilters, searchParams]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const anyFilterActive = useMemo(() => {
    if (!searchParams) return false;
    const keys = Array.from(searchParams.keys()).filter(k => k !== 'page' && k !== 'sort_by');
    return keys.length > 0;
  }, [searchParams]);

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);
  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const toggleFilterParam = (filterKey: string, filterValue: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('page', '1');

    const existing = params.getAll(filterKey);

    if (existing.includes(filterValue)) {
      const remaining = existing.filter(v => v !== filterValue);
      params.delete(filterKey);
      remaining.forEach(v => params.append(filterKey, v));
    } else {
      params.append(filterKey, filterValue);
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    const currentSort = searchParams?.get('sort_by');
    if (currentSort) {
      params.set('sort_by', currentSort);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const isFilterActive = (filterKey: string, filterValue: string) => {
    if (!hydrated) return false;
    const values = searchParams.getAll(filterKey);
    return values.includes(filterValue);
  };

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');

    if (value) {
      params.set('sort_by', value);
    } else {
      params.delete('sort_by');
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Check if we have actual filter data
  const hasFilters = filters && filters.length > 0;
  const hasSubCollectionFilters = subCollectionFilters && subCollectionFilters.length > 0;

  return (
    <>
      {/* Trigger Button */}
      <div className={classNames(styles.triggerContainer, { [styles.hidden]: drawerOpen })}>
        <div className={styles.triggerText} onClick={openDrawer}>
          <span>Filters & Sorting</span>
          {/* {(anyFilterActive || hasSubCollectionFilters) && <span className={styles.filterIndicator}>•</span>} */}
        </div>
      </div>

      {/* Overlay */}
      <div
        className={classNames(styles.overlay, { [styles.open]: drawerOpen })}
        onClick={closeDrawer}
        aria-hidden={!drawerOpen}
      />

      {/* Drawer */}
      <aside className={classNames(styles.drawer, { [styles.open]: drawerOpen })} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <Text size="h4" text="Filters & Sorting" />
          <button aria-label="Close filters" className={styles.closeBtn} onClick={closeDrawer}>
            <Icon title="close" />
          </button>
        </div>

        <div className={styles.content}>
          {/* Sort By Section */}
          {/* <section className={styles.section}>
            <button
              className={styles.sectionHeader}
              onClick={() => toggleSection('sort')}
              aria-expanded={!!expandedSections['sort']}
            >
              <span>Sort By</span>
              <Icon
                title="chevronDown"
                className={classNames(styles.chev, { [styles.rotate]: expandedSections['sort'] })}
              />
            </button>

            {expandedSections['sort'] && (
              <div className={styles.sectionBody}>
                <div className={styles.sortOptions}>
                  {[
                    { value: '', label: 'Featured' },
                    { value: 'best-selling', label: 'Best Selling' },
                    { value: 'price-ascending', label: 'Price: Low to High' },
                    { value: 'price-descending', label: 'Price: High to Low' },
                    { value: 'title-ascending', label: 'A-Z' },
                    { value: 'title-descending', label: 'Z-A' },
                    { value: 'created-descending', label: 'Newest' },
                    { value: 'created-ascending', label: 'Oldest' }
                  ].map(option => {
                    const currentSort = searchParams?.get('sort_by') || '';
                    const isActive = currentSort === option.value;

                    return (
                      <button
                        key={option.value}
                        className={classNames(styles.sortOption, { [styles.activeSort]: isActive })}
                        onClick={() => handleSortChange(option.value)}
                      >
                        {option.label}
                        {isActive && <Icon title="check" className={styles.checkIcon} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section> */}

          {/* Sub-collection Filters */}
          {hasSubCollectionFilters && (
            <section className={styles.section}>
              <button
                className={styles.sectionHeader}
                onClick={() => toggleSection('subcollections')}
                aria-expanded={!!expandedSections['subcollections']}
              >
                <span>Collections</span>
                <Icon
                  title="chevronDown"
                  className={classNames(styles.chev, { [styles.rotate]: expandedSections['subcollections'] })}
                />
              </button>

              {expandedSections['subcollections'] && (
                <div className={styles.sectionBody}>
                  {subCollectionFilters.map(sc => (
                    <a
                      key={sc.handle}
                      href={`/${sc.handle}/`}
                      className={classNames(styles.linkButton, { [styles.activeLink]: sc.isSelected })}
                      onClick={closeDrawer}
                    >
                      {sc.title}
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Shopify Filters */}
          {hasFilters ? (
            filters.map(filter => {
              const sectionKey = filter.id || filter.label;

              // Check if this filter has any values
              const hasValues = filter.values && filter.values.length > 0;

              if (!hasValues) return null;

              return (
                <section className={styles.section} key={sectionKey}>
                  <button
                    className={styles.sectionHeader}
                    onClick={() => toggleSection(sectionKey)}
                    aria-expanded={!!expandedSections[sectionKey]}
                  >
                    <span>{filter.label}</span>
                    <Icon
                      title="chevronDown"
                      className={classNames(styles.chev, { [styles.rotate]: expandedSections[sectionKey] })}
                    />
                  </button>

                  {expandedSections[sectionKey] && (
                    <div className={styles.sectionBody}>
                      {filter.values.map(v => {
                        // Parse the filter ID to get the key and value
                        const idSplit = v.id.split('.');
                        const filterValue = idSplit.slice(-1)[0];
                        const filterKey = idSplit.slice(0, -1).join('.');
                        const active = isFilterActive(filterKey, filterValue);

                        return (
                          <label
                            key={v.id}
                            className={classNames(styles.checkboxLabel, { [styles.activeCheckbox]: active })}
                          >
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() => toggleFilterParam(filterKey, filterValue)}
                            />
                            <span className={styles.checkboxFake} />
                            <span className={styles.checkboxText}>
                              {v.label}
                              {v.count !== undefined && v.count !== null && (
                                <span className={styles.count}>({v.count})</span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })
          ) : (
            // Show message if no filters available
            <div className={styles.noFilters}></div>
          )}

          <div className={styles.footer}>
            <div className={styles.footerRow}>
              {anyFilterActive && (
                <button className={styles.clearBtn} onClick={clearAllFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default FiltersDrawer;
