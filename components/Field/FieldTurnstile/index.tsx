'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './styles.module.scss';

/**
 * Cloudflare Turnstile widget.
 *
 * Rendered alongside the `_gotcha` honeypot in <Form>, and wired explicitly into
 * ContactSidebar, which uses a plain <form>.
 *
 * The widget is "interaction-only": it verifies silently for virtually every genuine
 * visitor and only becomes visible when Cloudflare decides a challenge is warranted.
 *
 * It must never block a submission on its own. Ad-blockers and privacy extensions do
 * block challenges.cloudflare.com, and a customer who cannot load the script is far
 * more likely to be real than not - so when the script is blocked, missing or errors,
 * `getFields()` reports `_turnstileUnavailable` and the server decides what to do
 * with that. See the failure-mode table in the design spec.
 */

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** Give a blocked or slow script this long before giving up on it. */
const LOAD_TIMEOUT_MS = 10_000;

/** At submit time, wait this long for a challenge still in flight. */
const PENDING_TOKEN_WAIT_MS = 2_500;

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

/** Load the Turnstile script once per page, shared across every widget instance. */
const loadTurnstileScript = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.reject(new Error('ssr'));
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement('script');
    const timer = setTimeout(() => reject(new Error('timeout')), LOAD_TIMEOUT_MS);

    script.addEventListener('load', () => {
      clearTimeout(timer);
      window.turnstile ? resolve() : reject(new Error('loaded-without-api'));
    });
    script.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error('blocked'));
    });

    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }).catch(error => {
    // Allow a later mount to retry rather than caching the failure forever.
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
};

export type TurnstileFields = { _turnstileToken: string } | { _turnstileUnavailable: true };

export type TurnstileHandle = {
  /**
   * Callback ref for the container element. Deliberately a callback rather than a
   * RefObject: ContactSidebar only renders its form once the user opens it, so the
   * element appears long after the hook mounts. An effect keyed on a ref object
   * would run while `.current` was still null and silently never render the widget.
   */
  containerRef: (element: HTMLDivElement | null) => void;
  /** Fields to merge into the submitted payload. Never rejects. */
  getFields: () => Promise<TurnstileFields>;
  /** Tokens are single-use - reset after every submission. */
  reset: () => void;
};

export const useTurnstile = (): TurnstileHandle => {
  // State, not a ref, so attaching the element re-runs the effect below.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const tokenRef = useRef<string | null>(null);
  const unavailableRef = useRef(false);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!container) return;

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!siteKey) {
      // Unconfigured environment - behave exactly as if the script were blocked.
      unavailableRef.current = true;
      return;
    }

    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile) return;

        widgetIdRef.current = window.turnstile.render(container, {
          sitekey: siteKey,
          appearance: 'interaction-only',
          callback: (token: string) => {
            tokenRef.current = token;
            unavailableRef.current = false;
          },
          'error-callback': () => {
            tokenRef.current = null;
            unavailableRef.current = true;
          },
          'expired-callback': () => {
            tokenRef.current = null;
          }
        });
      })
      .catch(() => {
        if (!cancelled) unavailableRef.current = true;
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Widget already gone - nothing to clean up.
        }
      }
      widgetIdRef.current = null;
    };
  }, [container]);

  const getFields = useCallback(async (): Promise<TurnstileFields> => {
    if (tokenRef.current) return { _turnstileToken: tokenRef.current };
    if (unavailableRef.current) return { _turnstileUnavailable: true };

    // Rendered but not solved yet. Give the challenge a moment rather than reporting
    // a working widget as unavailable and weakening the check for no reason.
    const deadline = Date.now() + PENDING_TOKEN_WAIT_MS;
    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (tokenRef.current) return { _turnstileToken: tokenRef.current };
      if (unavailableRef.current) break;
    }

    return { _turnstileUnavailable: true };
  }, []);

  const reset = useCallback(() => {
    tokenRef.current = null;
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        // Nothing usable to reset.
      }
    }
  }, []);

  // Stable identity: <Form> lists this handle in a useCallback dependency array, so a
  // fresh object each render would rebuild its submit handler on every keystroke.
  return useMemo(() => ({ containerRef: setContainer, getFields, reset }), [setContainer, getFields, reset]);
};

type FieldTurnstileProps = { containerRef: (element: HTMLDivElement | null) => void };

const FieldTurnstile = ({ containerRef }: FieldTurnstileProps) => (
  <div ref={containerRef} className={styles.container} />
);

export default FieldTurnstile;
