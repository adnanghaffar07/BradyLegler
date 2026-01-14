const KLAVIYO_PRIVATE_API_KEY = process.env.KLAVIYO_PRIVATE_API_KEY!;
const KLAVIYO_LIST_ID = process.env.KLAVIYO_LIST_ID!;
const KLAVIYO_API_REVISION = '2024-05-15';

type SubmitFormResponse = {
  status: 'success' | 'error';
  message: string;
};

const submitForm = async (data: {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  contactMethod?: string;
  message?: string;
  formName?: string;
}): Promise<SubmitFormResponse> => {
  try {
    const { email, firstName, lastName, phone, contactMethod, message = '', formName } = data || {};

    if (!email || !firstName || !lastName || !formName) {
      throw new Error('Missing required fields.');
    }

    console.log('Processing form submission for:', email);

    // Clean and validate List ID
    let cleanListId = KLAVIYO_LIST_ID;

    // Remove URL prefix if present
    if (cleanListId.includes('klaviyo.com')) {
      const match = cleanListId.match(/list\/([^\/]+)/);
      if (match && match[1]) {
        cleanListId = match[1];
      }
    }

    console.log('Cleaned List ID:', cleanListId);

    // 1️⃣ Create or update profile
    let profileId: string | undefined;

    const profileResp = await fetch('https://a.klaviyo.com/api/profiles/', {
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
            email,
            first_name: firstName,
            last_name: lastName,
            phone_number: phone || undefined
          }
        }
      })
    });

    const profileData = await profileResp.json();

    if (!profileResp.ok) {
      const errors = profileData?.errors;
      if (errors) {
        const duplicateProfile = errors.find((e: any) => e.code === 'duplicate_profile');
        if (duplicateProfile) {
          profileId = duplicateProfile.meta?.duplicate_profile_id;
          console.log('Found duplicate profile, ID:', profileId);
        } else {
          throw new Error(errors[0]?.detail || 'Failed to create profile.');
        }
      }
    } else {
      profileId = profileData.data.id;
      console.log('Created new profile, ID:', profileId);
    }

    // ✅ Ensure profileId exists
    if (!profileId) {
      throw new Error('Failed to retrieve profile ID from Klaviyo.');
    }

    // 2️⃣ Subscribe profile to the list (FIXED CONDITION)
    if (cleanListId && cleanListId.trim() !== '') {
      console.log('Subscribing profile to list:', cleanListId);

      try {
        const subscribeResp = await fetch(`https://a.klaviyo.com/api/lists/${cleanListId}/relationships/profiles/`, {
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
        });

        console.log('Subscription response status:', subscribeResp.status);

        // Get response for debugging
        let responseText = '';
        try {
          responseText = await subscribeResp.text();
          if (responseText) {
            const subscribeData = JSON.parse(responseText);
            console.log('Subscription response data:', subscribeData);
          }
        } catch (e) {
          // Response might be empty or non-JSON
        }

        if (subscribeResp.status === 204 || subscribeResp.status === 200) {
          console.log('Successfully subscribed profile to list');
        } else {
          console.error('Failed to subscribe to list. Status:', subscribeResp.status);
          console.error('Response:', responseText);
        }
      } catch (subscribeError) {
        console.error('List subscription error:', subscribeError);
      }
    } else {
      console.error('No valid List ID found. Check KLAVIYO_LIST_ID environment variable.');
    }

    // 3️⃣ Create form submission event
    try {
      const eventResp = await fetch('https://a.klaviyo.com/api/events/', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          revision: KLAVIYO_API_REVISION,
          Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`
        },
        body: JSON.stringify({
          data: {
            type: 'event',
            attributes: {
              properties: {
                form_name: formName,
                inquiry_type: 'Contact Inquiry',
                message: message || '',
                phone: phone || '',
                contact_method: contactMethod || '',
                first_name: firstName,
                last_name: lastName,
                email: email
              },
              metric: {
                data: {
                  type: 'metric',
                  attributes: { name: 'Form Submission' }
                }
              },
              profile: {
                data: {
                  type: 'profile',
                  id: profileId
                }
              },
              time: new Date().toISOString()
            }
          }
        })
      });

      if (!eventResp.ok) {
        const eventData = await eventResp.json();
        console.warn('Event creation warning:', eventData.errors?.[0]?.detail);
      } else {
        console.log('Event created successfully');
      }
    } catch (eventError) {
      console.warn('Event creation error:', eventError);
    }

    return {
      status: 'success',
      message: 'Form submitted successfully'
    };
  } catch (error: any) {
    console.error('Klaviyo submission error:', error);
    return {
      status: 'error',
      message: error.message || 'Unexpected error occurred'
    };
  }
};

export default submitForm;
