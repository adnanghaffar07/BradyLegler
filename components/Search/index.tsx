'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from '@/components/Link';
import Text from '@/components/Text';
import SidePanel from '@/components/SidePanel';
import formatCurrency from '@/helpers/formatCurrency';
import { useSearch } from '@/tools/store/useSearch';
import type { SearchProduct } from '@/app/api/search/route';
import styles from './styles.module.scss';

const MAX_RESULTS = 30;

// Lower-case and drop accents, so "pave" finds "Pavé".
const normalize = (value?: string | null) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const THUMBNAIL_SIZE = 192; // 96px displayed, at 2x for retina screens

/**
 * Both image hosts resize on their own CDN, so thumbnails skip the Next image
 * optimizer: a list of results would otherwise queue a dozen resizes at once.
 */
const thumbnailUrl = (src: string) => {
  try {
    const url = new URL(src);
    if (url.hostname === 'cdn.sanity.io') {
      url.searchParams.set('w', String(THUMBNAIL_SIZE));
      url.searchParams.set('h', String(THUMBNAIL_SIZE));
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('auto', 'format');
    } else if (url.hostname === 'cdn.shopify.com') {
      url.searchParams.set('width', String(THUMBNAIL_SIZE));
      url.searchParams.set('height', String(THUMBNAIL_SIZE));
      url.searchParams.set('crop', 'center');
    }
    return url.toString();
  } catch {
    return src;
  }
};

const formatPrice = (product: SearchProduct) => {
  if (product.inquireButtonEnabled) {
    return product.inquirePriceText?.trim() || 'Price Available on Request';
  }
  if (!product.minPrice) return null;

  const min = formatCurrency({ amount: product.minPrice });
  return product.maxPrice && product.maxPrice > product.minPrice ? `From ${min}` : min;
};

/**
 * Every word typed must match the start of a word in the product's title, type or
 * tags, so "ring" finds rings but not earrings, while "ear" still finds earrings as
 * the visitor types. Title matches rank first, then titles that start with the query.
 */
const toWords = (value: string) => value.split(/[^a-z0-9]+/).filter(Boolean);

const searchProducts = (products: SearchProduct[], query: string) => {
  const queryWords = toWords(normalize(query));
  if (!queryWords.length) return [];

  const phrase = queryWords.join(' ');
  const matchesAny = (words: string[], queryWord: string) => words.some(word => word.startsWith(queryWord));

  return products
    .map(product => {
      const titleWords = toWords(normalize(product.title));
      const allWords = [...titleWords, ...toWords(normalize(product.productType)), ...toWords(normalize(product.tags))];
      if (!queryWords.every(queryWord => matchesAny(allWords, queryWord))) return null;

      const title = titleWords.join(' ');
      let score = 0;
      if (title.startsWith(phrase)) score += 3;
      if (title.includes(phrase)) score += 2;
      score += queryWords.filter(queryWord => matchesAny(titleWords, queryWord)).length;
      return { product, score };
    })
    .filter((match): match is { product: SearchProduct; score: number } => match !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map(match => match.product);
};

// Fetched once per visit and shared by every open of the panel.
let productIndexRequest: Promise<SearchProduct[]> | null = null;

const loadProductIndex = () => {
  if (!productIndexRequest) {
    productIndexRequest = fetch('/api/search')
      .then(response => (response.ok ? response.json() : Promise.reject(response.status)))
      .catch(error => {
        // Let the next open try again rather than caching the failure.
        productIndexRequest = null;
        throw error;
      });
  }
  return productIndexRequest;
};

const Search = () => {
  const searchOpen = useSearch(state => state.searchOpen);
  const setSearchOpen = useSearch(state => state.setSearchOpen);
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<SearchProduct[] | null>(null);
  const [failed, setFailed] = useState(false);

  // Must keep the same identity across renders: SidePanel re-runs its focus effect
  // whenever onClose changes, which would move focus to the Close button on every
  // keystroke.
  const closeSearch = useCallback(() => setSearchOpen(false), [setSearchOpen]);

  // Close when the visitor follows a result to another page.
  useEffect(() => {
    setSearchOpen(false);
  }, [pathname, setSearchOpen]);

  useEffect(() => {
    if (!searchOpen) return;

    // The panel slides in, so focus once it is on screen.
    const focusTimer = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);

    if (!products) {
      setFailed(false);
      loadProductIndex()
        .then(setProducts)
        .catch(() => setFailed(true));
    }

    return () => clearTimeout(focusTimer);
  }, [searchOpen, products]);

  const results = useMemo(() => (products ? searchProducts(products, query) : []), [products, query]);
  const hasQuery = query.trim().length > 0;

  const renderStatus = () => {
    if (failed) return 'Search is unavailable right now. Please try again.';
    if (!hasQuery) return null;
    if (!products) return 'Searching…';
    if (!results.length) return `No pieces found for “${query.trim()}”.`;
    return null;
  };

  const status = renderStatus();

  return (
    <SidePanel title="Search" show={searchOpen} onClose={closeSearch} closeOnEscape>
      <div className={styles.field}>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search"
          aria-label="Search products"
          className={styles.input}
          autoComplete="off"
          spellCheck={false}
        />
        {hasQuery && (
          <button type="button" className={styles.clear} onClick={() => setQuery('')}>
            Clear
          </button>
        )}
      </div>

      <SidePanel.Body>
        {status && (
          <div className={styles.status} aria-live="polite">
            <Text size="b2" text={status} />
          </div>
        )}

        {results.length > 0 && (
          <ul className={styles.results}>
            {results.map(product => {
              const price = formatPrice(product);
              const href = `/${product.handle}`;
              return (
                <li key={product.handle}>
                  <Link
                    href={href}
                    className={styles.result}
                    // Stay open until the new page loads (the pathname effect closes it),
                    // unless this is the page already showing, where nothing will load.
                    onClick={() => pathname?.replace(/\/$/, '') === href && closeSearch()}
                  >
                    <div className={styles.image}>
                      {product.image && (
                        <Image
                          src={thumbnailUrl(product.image)}
                          alt={product.title}
                          width={96}
                          height={96}
                          unoptimized
                        />
                      )}
                    </div>
                    <div className={styles.details}>
                      <Text size="b2" text={product.title} />
                      {price && <Text size="b3" className={styles.price} text={price} />}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </SidePanel.Body>
    </SidePanel>
  );
};

export default Search;
