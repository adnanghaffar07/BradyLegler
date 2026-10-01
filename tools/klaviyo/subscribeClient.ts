const KLAVIYO_COMPANY_ID = process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY;
const KLAVIYO_NEWSLETTER_LIST_ID = process.env.NEXT_PUBLIC_KLAVIYO_NEWSLETTER_LIST_ID;
const KLAVIYO_API_REVISION = '2024-10-15';

// Recorded against the consent record in Klaviyo as proof of where the opt-in came
// from. Keep it descriptive - it is what you point at if consent is ever questioned.
const CONSENT_SOURCE = 'Website Newsletter Form';

export type ClientSubscribeResult =
  | { status: 'success' }
  | { status: 'unconfigured' }
  | { status: 'error'; message: string };

/** True when the browser has everything it needs to subscribe directly. */
export const canSubscribeFromBrowser = () =>
  Boolean(KLAVIYO_COMPANY_ID && KLAVIYO_NEWSLETTER_LIST_ID);

/**
 * Subscribes an email to the newsletter list from the BROWSER, using Klaviyo's
 * client-side subscriptions endpoint.
 *
 * Why this runs client-side: subscribing from the server sends every signup to
 * Klaviyo from the same few Vercel datacentre IPs with no browser context, so a
 * hundred genuine signups look to Klaviyo's bot protection like one machine
 * submitting a hundred times - which is how real subscribers end up auto-suppressed.
 * Calling from the browser gives Klaviyo the subscriber's real IP, user agent and
 * session, so its bot detection can judge the signup honestly.
 *
 * This endpoint authenticates with the PUBLIC company id (safe to expose) rather
 * than the private API key, which must never reach the browser.
 */
export const subscribeFromBrowser = async (email: string): Promise<ClientSubscribeResult> => {
  if (!canSubscribeFromBrowser()) {
    return { status: 'unconfigured' };
  }

  if (!email) {
    return { status: 'error', message: 'Email is required.' };
  }

  try {
    const response = await fetch(
      `https://a.klaviyo.com/client/subscriptions/?company_id=${encodeURIComponent(KLAVIYO_COMPANY_ID as string)}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          revision: KLAVIYO_API_REVISION
        },
        body: JSON.stringify({
          data: {
            type: 'subscription',
            attributes: {
              custom_source: CONSENT_SOURCE,
              profile: {
                data: {
                  type: 'profile',
                  attributes: {
                    email,
                    subscriptions: {
                      email: {
                        marketing: {
                          consent: 'SUBSCRIBED'
                        }
                      }
                    }
                  }
                }
              }
            },
            relationships: {
              list: {
                data: {
                  type: 'list',
                  id: KLAVIYO_NEWSLETTER_LIST_ID as string
                }
              }
            }
          }
        })
      }
    );

    // Klaviyo queues this as a job and answers 202 Accepted with no body.
    if (response.status === 202 || response.ok) {
      return { status: 'success' };
    }

    let message = 'Subscription failed.';
    try {
      const errorData = await response.json();
      message = errorData?.errors?.[0]?.detail || message;
    } catch {
      // No JSON body to parse.
    }

    return { status: 'error', message };
  } catch (error: any) {
    // Network failure, ad-blocker, or offline - the caller falls back to the server route.
    return { status: 'error', message: error?.message || 'Subscription request failed.' };
  }
};

export default subscribeFromBrowser;
