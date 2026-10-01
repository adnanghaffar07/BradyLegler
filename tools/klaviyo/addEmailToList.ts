const KLAVIYO_PRIVATE_API_KEY = process.env.KLAVIYO_PRIVATE_API_KEY!;
// Use newsletter-specific list ID if provided, otherwise fall back to default list ID
const KLAVIYO_LIST_ID = process.env.KLAVIYO_NEWSLETTER_LIST_ID || process.env.KLAVIYO_LIST_ID!;
const KLAVIYO_API_REVISION = '2024-10-15';

// Recorded against the consent record in Klaviyo as proof of where the opt-in came
// from. Keep it descriptive - it is what you point at if consent is ever questioned.
const CONSENT_SOURCE = 'Website Newsletter Form';

type AddEmailToListResponse = {
  status: 'success' | 'error';
  message: string;
  data?: {
    listId: string;
  };
};

/**
 * Subscribes an email address to the newsletter list WITH marketing consent.
 *
 * Note on the endpoint choice: adding a profile through
 * `POST /api/lists/{id}/relationships/profiles/` only creates list *membership* - it
 * does not grant email marketing consent, so the profile stays "Never Subscribed"
 * and every marketing send and flow message to it is skipped. Consent can only be
 * set through the subscription endpoint used below, which also creates or updates
 * the profile and adds it to the list in the same call.
 */
const addEmailToList = async (data: { email?: string }): Promise<AddEmailToListResponse> => {
  try {
    const { email } = data || {};

    if (!email) {
      throw new Error('Email is required to create a profile.');
    }

    if (!KLAVIYO_PRIVATE_API_KEY) {
      throw new Error('KLAVIYO_PRIVATE_API_KEY is not configured');
    }

    if (!KLAVIYO_LIST_ID) {
      throw new Error('KLAVIYO_NEWSLETTER_LIST_ID or KLAVIYO_LIST_ID is not configured');
    }

    const response = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        revision: KLAVIYO_API_REVISION,
        Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`
      },
      body: JSON.stringify({
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            custom_source: CONSENT_SOURCE,
            profiles: {
              data: [
                {
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
              ]
            }
          },
          relationships: {
            list: {
              data: {
                type: 'list',
                id: KLAVIYO_LIST_ID
              }
            }
          }
        }
      })
    });

    // Klaviyo queues this as a job and answers 202 Accepted with no body.
    if (response.status === 202 || response.ok) {
      return {
        status: 'success',
        message: 'Profile subscribed to list',
        data: { listId: KLAVIYO_LIST_ID }
      };
    }

    let errorMessage = 'Failed to subscribe profile.';
    try {
      const errorData = await response.json();
      errorMessage = errorData?.errors?.[0]?.detail || errorMessage;
    } catch {
      // No JSON body to parse.
    }

    throw new Error(errorMessage);
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Unexpected error occurred.'
    };
  }
};

export default addEmailToList;
