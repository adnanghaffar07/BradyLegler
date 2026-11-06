'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Text from '@/components/Text';
import styles from '../../styles.module.scss';

const VendorGate = () => {
  const router = useRouter();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!passcode.trim() || submitting) return;

    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/vendor/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.message || 'Something went wrong. Please try again.');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setPasscode('');
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.centered}>
      <Text as="h1" size="h1" text="Vendor orders" />
      <Text
        as="p"
        size="b2"
        className={styles.muted}
        text="This page is for our trade partners. Enter the vendor passcode to browse the collection and send an order request."
      />
      <form className={styles.gateForm} onSubmit={onSubmit}>
        <label className={styles.label} htmlFor="vendor-passcode">
          Passcode
        </label>
        <input
          id="vendor-passcode"
          type="password"
          className={styles.input}
          value={passcode}
          onChange={event => setPasscode(event.target.value)}
          autoComplete="current-password"
          autoFocus
          disabled={submitting}
        />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className={styles.primaryButton} disabled={submitting || !passcode.trim()}>
          {submitting ? 'Checking…' : 'Enter'}
        </button>
      </form>
    </section>
  );
};

export default VendorGate;
