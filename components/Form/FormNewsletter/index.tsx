'use client';

import React, { useState } from 'react';
import Form from '@/components/Form';
import Field from '@/components/Field';
import styles from './styles.module.scss';
import FormThankYou from '@/components/Form/FormThankYou';

const LOADING_DURATION = 3000;
const SUCCESS_DURATION = 3000;

const FormNewsletter = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleOnSubmit = async (values: any, methods) => {
    try {
      setStatus('loading');

      const [response] = await Promise.all([
        fetch('/api/form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'newsletter',
            ...values
          })
        }),
        new Promise(resolve => setTimeout(resolve, LOADING_DURATION))
      ]);

      const data = await response.json();

      if (!response.ok || data.status !== 'success') {
        throw new Error(data.message || 'Form submission failed');
      }

      setStatus('success');

      methods?.reset();

      setTimeout(() => {
        setStatus('idle');
      }, SUCCESS_DURATION);
    } catch (error) {
      setStatus('error');
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }
  };

  return (
    <>
      <div className={styles.container}>
        <Form onSubmit={handleOnSubmit} layout="normal">
          <Field.Email className={styles.email} name="email" placeholder="Subscribe to Newsletter" required />
          <Field.Submit className={styles.button} text="Submit" />
        </Form>
      </div>
      <FormThankYou
        status={status}
        message={{
          loading: 'We are subscribing you to our newsletter...',
          success: 'Thank you for subscribing to our newsletter.'
        }}
      />
    </>
  );
};

export default FormNewsletter;
