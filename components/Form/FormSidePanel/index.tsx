'use client';

import React, { useState } from 'react';
import Form from '@/components/Form';
import Field from '@/components/Field';
import Link from '@/components/Link';
import Text from '@/components/Text';
import SidePanel from '@/components/SidePanel';
import FormThankYou from '@/components/Form/FormThankYou';
import styles from './styles.module.scss';

type FormSidePanelProps = {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode[];
  title?: string;
  submitText?: string;
  formName: string;
};

const LOADING_DURATION = 3000;
const SUCCESS_DURATION = 3000;

const FormSidePanel: React.FC<FormSidePanelProps> = props => {
  const { title = 'Enquiry', show = true, submitText = 'Enquire', onClose, children, formName } = props;
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleOnSubmit = async (values: any, methods) => {
    try {
      const { captcha, terms, ...otherValues } = values || {};

      setStatus('loading');

      const [response] = await Promise.all([
        fetch('/api/form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ type: 'enquiry', formName, ...values })
        }),
        new Promise(resolve => setTimeout(resolve, LOADING_DURATION))
      ]);

      const data = await response.json();

      if (!response.ok || data.status !== 'success') {
        throw new Error(data.message || 'Form submission failed');
      }

      setStatus('success');

      onClose();
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

  const termsLabel = (
    <Text size="b3">
      {`I agree to the `}
      <Link href="/terms-and-conditions" text="Terms of Use" style={{ textDecoration: 'underline' }} target="_blank" />
    </Text>
  );

  return (
    <>
      <SidePanel title={title} show={show} onClose={onClose}>
        <SidePanel.Body>
          <div className={styles.container}>
            <Form onSubmit={handleOnSubmit} layout="normal">
              {children}

              <Field.Toggle label="Complete the captcha" name="captcha" className={styles.captcha} required hideError />
              <Field.Toggle label={termsLabel} name="terms" className={styles.terms} required hideError />

              <div className={styles.footer}>
                <Field.Submit
                  variant="square"
                  text={submitText}
                  disabled={status === 'loading' || status === 'success'}
                />
              </div>
            </Form>
          </div>
        </SidePanel.Body>
      </SidePanel>
      <FormThankYou status={status} />
    </>
  );
};

export default FormSidePanel;
