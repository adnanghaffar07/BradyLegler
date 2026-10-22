'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './styles.module.scss';

/**
 * Cloudflare Turnstile widget.
 *
 * Rendered alongside the `_gotcha` honeypot in <Form>, and wired explicitly into
 * ContactSidebar, which uses a plain <form>.
 *
 * The widget is visible on the form from the moment it loads. Cloudflare solves it
 * silently for most genuine visitors - they see a brief tick - and shows a challenge
 * to the rest. Either way it is dealt with BEFORE the customer presses submit, rather
 * than appearing afterwards, which is confusing and leaves the challenge unanswered.
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

/**
 * How long a token may be reused before it is reminted. Turnstile tokens expire after
 * 300s; staying well inside that avoids submitting one that died while the tab sat in
 * the background, which siteverify reports as `invalid-input-response`.
 */
const MAX_TOKEN_AGE_MS = 90_000;

/**
 * How long to wait for a challenge at submit time. Generous on purpose: if Cloudflare
 * asks this visitor to interact, a human needs time to notice the widget and click it.
 */
const CHALLENGE_WAIT_MS = 45_000;

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
  /**
   * Fields to merge into the submitted payload, carrying a token minted seconds ago.
   * Waits for an interactive challenge if Cloudflare asks for one. Never rejects.
   */
  getFields: () => Promise<TurnstileFields>;
  /** True while a challenge is in flight, so the form can say why it is waiting. */
  pending: boolean;
};

/**
 * `action` is baked into the token by Cloudflare at render time and reported back by
 * siteverify, so the server can confirm a token came from the form it claims to.
 * It is not client-supplied data at verification time, which is what makes it useful.
 */
export const useTurnstile = (action?: string): TurnstileHandle => {
  // State, not a ref, so attaching the element re-runs the effect below.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [pending, setPending] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const tokenAtRef = useRef(0);
  const unavailableRef = useRef(false);
  const widgetIdRef = useRef<string | null>(null);
  /** Resolvers waiting on the next challenge outcome. */
  const waitersRef = useRef<((token: string | null) => void)[]>([]);

  const settle = (token: string | null) => {
    const waiters = waitersRef.current;
    waitersRef.current = [];
    waiters.forEach(resolve => resolve(token));
  };

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
          appearance: 'always',
          ...(action ? { action } : {}),
          callback: (token: string) => {
            tokenRef.current = token;
            tokenAtRef.current = Date.now();
            unavailableRef.current = false;
            settle(token);
          },
          'error-callback': () => {
            tokenRef.current = null;
            unavailableRef.current = true;
            settle(null);
          },
          'expired-callback': () => {
            tokenRef.current = null;
          }
        });
      })
      .catch(() => {
        if (!cancelled) {
          unavailableRef.current = true;
          settle(null);
        }
      });

    return () => {
      cancelled = true;
      settle(null);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Widget already gone - nothing to clean up.
        }
      }
      widgetIdRef.current = null;
    };
  }, [container, action]);

  /** Start a fresh challenge and wait for its outcome. */
  const mintToken = useCallback((): Promise<string | null> => {
    if (!widgetIdRef.current || !window.turnstile) return Promise.resolve(null);

    return new Promise<string | null>(resolve => {
      const timer = setTimeout(() => {
        waitersRef.current = waitersRef.current.filter(w => w !== onSettled);
        resolve(null);
      }, CHALLENGE_WAIT_MS);

      const onSettled = (token: string | null) => {
        clearTimeout(timer);
        resolve(token);
      };

      waitersRef.current.push(onSettled);

      try {
        tokenRef.current = null;
        window.turnstile!.reset(widgetIdRef.current!);
      } catch {
        clearTimeout(timer);
        waitersRef.current = waitersRef.current.filter(w => w !== onSettled);
        resolve(null);
      }
    });
  }, []);

  const getFields = useCallback(async (): Promise<TurnstileFields> => {
    if (unavailableRef.current) return { _turnstileUnavailable: true };

    // A token minted moments ago is still good. Anything older is reminted rather
    // than risked: Turnstile tokens expire after 300s, and `expired-callback` cannot
    // be relied on to fire while a tab is backgrounded and its timers are throttled.
    //
    // It is consumed on the way out. Tokens are single-use, so handing the same one
    // to a second submission would fail siteverify as `timeout-or-duplicate` - a
    // retry after a failed submit has to carry a genuinely new token.
    const age = Date.now() - tokenAtRef.current;
    if (tokenRef.current && age < MAX_TOKEN_AGE_MS) {
      const token = tokenRef.current;
      tokenRef.current = null;
      return { _turnstileToken: token };
    }

    // Otherwise run a fresh challenge and wait for it properly. If Cloudflare decides
    // this visitor needs to interact, the widget becomes visible and we wait for them
    // - giving up early here is what previously let a challenge be bypassed.
    setPending(true);
    try {
      const token = await mintToken();
      // Consumed here too: the solve callback stores it, and leaving it there would
      // let the next submission resend a token this one has already spent.
      tokenRef.current = null;
      return token ? { _turnstileToken: token } : { _turnstileUnavailable: true };
    } finally {
      setPending(false);
    }
  }, [mintToken]);

  // Stable identity: <Form> lists this handle in a useCallback dependency array, so a
  // fresh object each render would rebuild its submit handler on every keystroke.
  return useMemo(() => ({ containerRef: setContainer, getFields, pending }), [setContainer, getFields, pending]);
};

type FieldTurnstileProps = {
  containerRef: (element: HTMLDivElement | null) => void;
  pending?: boolean;
};

const FieldTurnstile = ({ containerRef, pending }: FieldTurnstileProps) => (
  <div className={styles.wrapper}>
    <div ref={containerRef} className={styles.container} />
    {pending && <span className={styles.pending}>Checking your browser...</span>}
  </div>
);

export default FieldTurnstile;
