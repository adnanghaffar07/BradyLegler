'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Text from '@/components/Text';
import Button from '@/components/Button';
import SidePanel from '@/components/SidePanel';
import classNames from '@/tools/helpers/classNames';
import type { VendorCatalogProduct } from '@/tools/apis/shopify';
import {
  MAX_VENDOR_LINES,
  MAX_VENDOR_QUANTITY,
  REQUIRED_VENDOR_FIELDS,
  VendorOrderDetails,
  VendorOrderLine
} from '@/lib/vendor/types';
import styles from '../../styles.module.scss';

type VendorOrderProps = {
  products: VendorCatalogProduct[];
};

const STORAGE_KEY = 'bl_vendor_order_v1';

const EMPTY_DETAILS: VendorOrderDetails = {
  company: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  poNumber: '',
  notes: ''
};

const lineKey = (line: Pick<VendorOrderLine, 'handle' | 'options'>) =>
  `${line.handle}|${Object.entries(line.options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}=${value}`)
    .join('|')}`;

// Shopify resizes on its own CDN, so images skip the Next optimizer.
const imageUrl = (src: string, size: number) => {
  try {
    const url = new URL(src);
    url.searchParams.set('width', String(size));
    return url.toString();
  } catch {
    return src;
  }
};

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const isPainting = (productType: string) => /painting/i.test(productType);

const clampQuantity = (value: number) => Math.min(MAX_VENDOR_QUANTITY, Math.max(1, Math.floor(value) || 1));

type QuantityProps = { value: number; onChange: (value: number) => void; label: string };

const Quantity = ({ value, onChange, label }: QuantityProps) => (
  <div className={styles.quantity}>
    <button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(clampQuantity(value - 1))}>
      −
    </button>
    <input
      type="number"
      inputMode="numeric"
      min={1}
      max={MAX_VENDOR_QUANTITY}
      value={value}
      aria-label={label}
      onChange={event => onChange(clampQuantity(Number(event.target.value)))}
    />
    <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(clampQuantity(value + 1))}>
      +
    </button>
  </div>
);

const VendorOrder = ({ products }: VendorOrderProps) => {
  const router = useRouter();
  const productsByHandle = useMemo(() => new Map(products.map(product => [product.handle, product])), [products]);

  // Order, kept in this browser so a refresh does not lose it.
  const [lines, setLines] = useState<VendorOrderLine[]>([]);
  const [details, setDetails] = useState<VendorOrderDetails>(EMPTY_DETAILS);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved) {
        // Drop pieces that are no longer for sale.
        setLines((saved.lines || []).filter((line: VendorOrderLine) => productsByHandle.has(line.handle)));
        setDetails({ ...EMPTY_DETAILS, ...(saved.details || {}) });
      }
    } catch {
      // Storage unavailable: start empty.
    }
    setRestored(true);
  }, [productsByHandle]);

  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines, details }));
    } catch {
      // Storage unavailable: the order just won't survive a refresh.
    }
  }, [lines, details, restored]);

  // Catalogue filters
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  // Jewellery first, original paintings after it, each A-Z (the catalogue arrives A-Z).
  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => Number(isPainting(a.productType)) - Number(isPainting(b.productType))),
    [products]
  );
  const types = useMemo(
    () =>
      Array.from(new Set(sortedProducts.map(product => product.productType).filter(Boolean))).sort(
        (a, b) => Number(isPainting(a)) - Number(isPainting(b)) || a.localeCompare(b)
      ),
    [sortedProducts]
  );
  const visibleProducts = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    return sortedProducts.filter(product => {
      if (type && product.productType !== type) return false;
      const haystack = normalize(`${product.title} ${product.productType}`);
      return words.every(word => haystack.includes(word));
    });
  }, [sortedProducts, query, type]);

  const quantityByHandle = useMemo(() => {
    const totals = new Map<string, number>();
    lines.forEach(line => totals.set(line.handle, (totals.get(line.handle) || 0) + line.quantity));
    return totals;
  }, [lines]);
  const totalPieces = lines.reduce((sum, line) => sum + line.quantity, 0);

  // Add-to-order panel
  const [selected, setSelected] = useState<VendorCatalogProduct | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [addError, setAddError] = useState('');
  const [addedNote, setAddedNote] = useState('');

  const openProduct = (product: VendorCatalogProduct) => {
    setSelected(product);
    // Options with a single value are chosen for the vendor.
    setSelectedOptions(
      Object.fromEntries(product.options.filter(option => option.values.length === 1).map(o => [o.name, o.values[0]]))
    );
    setSelectedQuantity(1);
    setAddError('');
  };

  const addToOrder = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    const missingOption = selected.options.find(option => !selectedOptions[option.name]);
    if (missingOption) {
      setAddError(`Please choose a ${missingOption.name.toLowerCase()}.`);
      return;
    }

    const newLine: VendorOrderLine = { handle: selected.handle, options: selectedOptions, quantity: selectedQuantity };
    const key = lineKey(newLine);
    const existing = lines.find(line => lineKey(line) === key);
    if (!existing && lines.length >= MAX_VENDOR_LINES) {
      setAddError(`Orders are limited to ${MAX_VENDOR_LINES} lines.`);
      return;
    }

    setLines(current =>
      existing
        ? current.map(line =>
            lineKey(line) === key ? { ...line, quantity: clampQuantity(line.quantity + selectedQuantity) } : line
          )
        : [...current, newLine]
    );
    setAddedNote(`${selectedQuantity} × ${selected.title} added to your order.`);
    setSelected(null);
  };

  useEffect(() => {
    if (!addedNote) return;
    const timer = setTimeout(() => setAddedNote(''), 4000);
    return () => clearTimeout(timer);
  }, [addedNote]);

  // Review + submit panel
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmation, setConfirmation] = useState<{ reference: string; email: string } | null>(null);

  const updateLine = (key: string, quantity: number) =>
    setLines(current => current.map(line => (lineKey(line) === key ? { ...line, quantity } : line)));
  const removeLine = (key: string) => setLines(current => current.filter(line => lineKey(line) !== key));

  const onDetailChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setDetails(current => ({ ...current, [name]: value }));
  };

  const submitOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || !lines.length) return;
    if (REQUIRED_VENDOR_FIELDS.some(field => !details[field].trim())) {
      setSubmitError('Please fill in all required details.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/vendor/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines, details })
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) {
        router.refresh();
        throw new Error(result?.message);
      }
      if (!response.ok || result.status !== 'success') {
        throw new Error(result?.message || 'Your order could not be sent. Please try again.');
      }
      setConfirmation({ reference: result.reference, email: details.email });
      setLines([]);
      // Keep company and address for the next order; clear the one-off fields.
      setDetails(current => ({ ...current, poNumber: '', notes: '' }));
    } catch (err: any) {
      setSubmitError(err.message || 'Your order could not be sent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeReview = () => {
    setReviewOpen(false);
    setSubmitError('');
    setConfirmation(null);
  };

  const signOut = async () => {
    await fetch('/api/vendor/access', { method: 'DELETE' }).catch(() => null);
    router.refresh();
  };

  const field = (
    name: keyof VendorOrderDetails,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {}
  ) => {
    const required = REQUIRED_VENDOR_FIELDS.includes(name);
    return (
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor={`vendor-${name}`}>
          {label}
          {required ? ' *' : ''}
        </label>
        <input
          id={`vendor-${name}`}
          name={name}
          className={styles.input}
          value={details[name]}
          onChange={onDetailChange}
          required={required}
          disabled={submitting}
          {...props}
        />
      </div>
    );
  };

  return (
    <div className={classNames(styles.page, { [styles.hasBar]: lines.length > 0 })}>
      <header className={styles.intro}>
        <div className={styles.introTop}>
          <Text as="h1" size="h1" text="Vendor orders" />
          <Button variant="normal-sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
        <Text
          as="p"
          size="b2"
          className={styles.muted}
          text="Choose pieces, options and quantities, then send your order request. No payment is taken here: we will confirm trade pricing and timing with you by email."
        />
      </header>

      <div className={styles.filters}>
        <input
          type="search"
          className={styles.searchInput}
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search the collection"
          aria-label="Search the collection"
          autoComplete="off"
        />
        {types.length > 1 && (
          <div className={styles.chips} role="group" aria-label="Filter by type">
            {['', ...types].map(value => (
              <button
                key={value || 'all'}
                type="button"
                className={classNames(styles.chip, { [styles.chipActive]: type === value })}
                aria-pressed={type === value}
                onClick={() => setType(value)}
              >
                {value || 'All'}
              </button>
            ))}
          </div>
        )}
      </div>

      {visibleProducts.length === 0 ? (
        <Text as="p" size="b2" className={classNames(styles.muted, styles.empty)} text="No pieces match your search." />
      ) : (
        <ul className={styles.grid}>
          {visibleProducts.map(product => {
            const inOrder = quantityByHandle.get(product.handle);
            return (
              <li key={product.handle}>
                <button
                  type="button"
                  className={styles.card}
                  aria-label={`Add ${product.title} to order${inOrder ? ` (${inOrder} in order)` : ''}`}
                  onClick={() => openProduct(product)}
                >
                  <div className={styles.cardImage}>
                    {product.image && (
                      <Image
                        src={imageUrl(product.image, 600)}
                        alt={product.title}
                        fill
                        sizes="(min-width: 1025px) 25vw, (min-width: 769px) 33vw, 50vw"
                        unoptimized
                      />
                    )}
                    {inOrder ? <span className={styles.badge}>{inOrder} in order</span> : null}
                  </div>
                  <span className={styles.cardTitle}>{product.title}</span>
                  {product.productType && <span className={styles.cardType}>{product.productType}</span>}
                  <span className={styles.cardAction}>Add to order</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {lines.length > 0 && (
        <div className={styles.bar}>
          <span className={styles.barText} aria-live="polite">
            {addedNote || `Your order: ${totalPieces} ${totalPieces === 1 ? 'piece' : 'pieces'}`}
          </span>
          <button type="button" className={styles.primaryButton} onClick={() => setReviewOpen(true)}>
            Review order
          </button>
        </div>
      )}

      {/* Add to order */}
      <SidePanel
        title="Add to order"
        show={Boolean(selected)}
        onClose={() => setSelected(null)}
        closeOnEscape
        trapFocus
      >
        {selected && (
          <form className={styles.panelForm} onSubmit={addToOrder}>
            <SidePanel.Body>
              <div className={styles.panelInner}>
                {selected.image && (
                  <div className={styles.panelImage}>
                    <Image src={imageUrl(selected.image, 800)} alt={selected.title} fill sizes="540px" unoptimized />
                  </div>
                )}
                <div>
                  <Text as="h2" size="h2" text={selected.title} />
                  {selected.productType && (
                    <Text
                      as="p"
                      size="b3"
                      className={styles.muted}
                      spacing={['xs', '2xs']}
                      text={selected.productType}
                    />
                  )}
                </div>

                {selected.options.map(option => (
                  <div key={option.name} className={styles.formGroup}>
                    <span className={styles.label} id={`option-${option.name}`}>
                      {option.name}
                    </span>
                    <div className={styles.chips} role="radiogroup" aria-labelledby={`option-${option.name}`}>
                      {option.values.map(value => {
                        const active = selectedOptions[option.name] === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            className={classNames(styles.chip, { [styles.chipActive]: active })}
                            onClick={() => {
                              setSelectedOptions(current => ({ ...current, [option.name]: value }));
                              setAddError('');
                            }}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className={styles.formGroup}>
                  <span className={styles.label}>Quantity</span>
                  <Quantity value={selectedQuantity} onChange={setSelectedQuantity} label="Quantity" />
                </div>

                {addError && (
                  <p className={styles.error} role="alert">
                    {addError}
                  </p>
                )}
              </div>
            </SidePanel.Body>
            <SidePanel.Footer>
              <button type="submit" className={styles.primaryButton}>
                Add to order
              </button>
            </SidePanel.Footer>
          </form>
        )}
      </SidePanel>

      {/* Review and send */}
      <SidePanel title="Your order" show={reviewOpen} onClose={closeReview} closeOnEscape>
        {confirmation ? (
          <SidePanel.Body>
            <div className={styles.panelInner}>
              <Text as="h2" size="h2" text="Thank you, your order request has been sent." />
              <Text
                as="p"
                size="b2"
                className={styles.muted}
                text={`Your reference is ${confirmation.reference}. We will reply to ${confirmation.email} to confirm pricing and timing. No payment has been taken.`}
              />
              <div>
                <Button variant="normal-sm" onClick={closeReview}>
                  Back to the collection
                </Button>
              </div>
            </div>
          </SidePanel.Body>
        ) : lines.length === 0 ? (
          <SidePanel.Body>
            <div className={styles.panelInner}>
              <Text as="p" size="b2" className={styles.muted} text="Your order is empty." />
            </div>
          </SidePanel.Body>
        ) : (
          <form className={styles.panelForm} onSubmit={submitOrder} noValidate>
            <SidePanel.Body>
              <ul className={styles.lines}>
                {lines.map(line => {
                  const product = productsByHandle.get(line.handle);
                  if (!product) return null;
                  const key = lineKey(line);
                  const options = Object.entries(line.options);
                  return (
                    <li key={key} className={styles.line}>
                      <div className={styles.lineImage}>
                        {product.image && (
                          <Image src={imageUrl(product.image, 192)} alt="" width={72} height={72} unoptimized />
                        )}
                      </div>
                      <div className={styles.lineDetails}>
                        <Text size="b2" text={product.title} />
                        {options.length > 0 && (
                          <Text
                            size="b3"
                            className={styles.muted}
                            text={options.map(([name, value]) => `${name}: ${value}`).join(' · ')}
                          />
                        )}
                        <div className={styles.lineActions}>
                          <Quantity
                            value={line.quantity}
                            onChange={value => updateLine(key, value)}
                            label={`Quantity of ${product.title}`}
                          />
                          <Button variant="normal-sm" onClick={() => removeLine(key)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className={styles.panelInner}>
                <Text as="h2" size="h2" text="Your details" />
                {field('company', 'Company')}
                <div className={styles.formRow}>
                  {field('firstName', 'First name', { autoComplete: 'given-name' })}
                  {field('lastName', 'Last name', { autoComplete: 'family-name' })}
                </div>
                <div className={styles.formRow}>
                  {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
                  {field('phone', 'Phone', { type: 'tel', autoComplete: 'tel' })}
                </div>

                <Text as="h2" size="h2" text="Ship to" />
                {field('address1', 'Address', { autoComplete: 'address-line1' })}
                {field('address2', 'Apartment, suite, etc.', { autoComplete: 'address-line2' })}
                <div className={styles.formRow}>
                  {field('city', 'City', { autoComplete: 'address-level2' })}
                  {field('region', 'State / region', { autoComplete: 'address-level1' })}
                </div>
                <div className={styles.formRow}>
                  {field('postalCode', 'ZIP / postal code', { autoComplete: 'postal-code' })}
                  {field('country', 'Country', { autoComplete: 'country-name' })}
                </div>

                <Text as="h2" size="h2" text="Order notes" />
                {field('poNumber', 'PO number')}
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="vendor-notes">
                    Notes
                  </label>
                  <textarea
                    id="vendor-notes"
                    name="notes"
                    className={classNames(styles.input, styles.textarea)}
                    value={details.notes}
                    onChange={onDetailChange}
                    placeholder="Delivery dates, engraving, custom requests…"
                    rows={3}
                    disabled={submitting}
                  />
                </div>
              </div>
            </SidePanel.Body>
            <SidePanel.Footer className={styles.footer}>
              {submitError && (
                <p className={styles.error} role="alert">
                  {submitError}
                </p>
              )}
              <div className={styles.footerSummary}>
                <Text size="b2" text={`${totalPieces} ${totalPieces === 1 ? 'piece' : 'pieces'}`} />
                <Text size="b3" className={styles.muted} text="No payment is taken" />
              </div>
              <button type="submit" className={styles.primaryButton} disabled={submitting}>
                {submitting ? 'Sending…' : 'Send order request'}
              </button>
            </SidePanel.Footer>
          </form>
        )}
      </SidePanel>
    </div>
  );
};

export default VendorOrder;
