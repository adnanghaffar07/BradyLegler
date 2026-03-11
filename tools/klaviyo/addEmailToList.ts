const KLAVIYO_PRIVATE_API_KEY = process.env.KLAVIYO_PRIVATE_API_KEY!;
// Use newsletter-specific list ID if provided, otherwise fall back to default list ID
const KLAVIYO_LIST_ID = process.env.KLAVIYO_NEWSLETTER_LIST_ID || process.env.KLAVIYO_LIST_ID!;
const KLAVIYO_API_REVISION = '2024-05-15';

type AddEmailToListResponse = {
  status: 'success' | 'error';
  message: string;
  data?: {
    profileId: string;
    listId: string;
  };
};

const addEmailToList = async (data: { email?: string }): Promise<AddEmailToListResponse> => {
  try {
    const { email } = data || {};

    if (!email) {
      throw new Error('Email is required to create a profile.');
    }

    // Validate environment variables
    if (!KLAVIYO_PRIVATE_API_KEY) {
      throw new Error('KLAVIYO_PRIVATE_API_KEY is not configured');
    }

    if (!KLAVIYO_LIST_ID) {
      throw new Error('KLAVIYO_NEWSLETTER_LIST_ID or KLAVIYO_LIST_ID is not configured');
    }

    // Step 1: Create or get profile
    const response = await fetch(`https://a.klaviyo.com/api/profiles/`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        revision: KLAVIYO_API_REVISION,
        Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`
      },
      body: JSON.stringify({
        data: {
          type: 'profile',
          attributes: {
            email
          }
        }
      })
    });

    const responseData = await response.json();

    let profileId;

    if (!response.ok) {
      const errors = responseData?.errors;
      if (errors) {
        const duplicateProfileError = errors.find((error: any) => error.code === 'duplicate_profile');
        if (duplicateProfileError) {
          profileId = duplicateProfileError.meta?.duplicate_profile_id;
        } else {
          throw new Error(errors[0]?.detail || 'Failed to create profile.');
        }
      }
    } else {
      profileId = responseData.data.id;
    }

    if (!profileId) {
      throw new Error('Failed to get profile ID');
    }

    // Step 2: Subscribe profile to list
    const subscribeResponse = await fetch(
      `https://a.klaviyo.com/api/lists/${KLAVIYO_LIST_ID}/relationships/profiles/`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          revision: KLAVIYO_API_REVISION,
          Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`
        },
        body: JSON.stringify({
          data: [{ type: 'profile', id: profileId }]
        })
      }
    );

    // Klaviyo returns 204 No Content on success (no response body to parse)
    if (subscribeResponse.status === 204 || subscribeResponse.ok) {
      return {
        status: 'success',
        message: 'Profile subscribed to list',
        data: { profileId: profileId, listId: KLAVIYO_LIST_ID }
      };
    }

    // Only try to parse JSON if there's an error response
    let errorMessage = 'Failed to subscribe profile.';
    try {
      const subscribeData = await subscribeResponse.json();
      errorMessage = subscribeData.errors?.[0]?.detail || errorMessage;
    } catch (e) {
      // No JSON body to parse
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
