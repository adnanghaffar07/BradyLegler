'use client';

import React, { useState, useCallback } from 'react';
import FormSidePanel from '@/components/Form/FormSidePanel';
import Field from '@/components/Field';
import Button from '@/components/Button';

type ArtworkEnquiryFormProps = {
  isOnSale: boolean;
};

const ArtworkEnquiryForm: React.FC<ArtworkEnquiryFormProps> = props => {
  const { isOnSale } = props;
  const [showForm, setShowForm] = useState(false);

  const handleClick = useCallback(() => {
    if (isOnSale) {
      setShowForm(true);
    }
  }, [isOnSale]);

  return (
    <>
      <Button onClick={handleClick} text={isOnSale ? 'Inquire' : 'Sold'} disabled={!isOnSale} variant="square" />

      <FormSidePanel show={showForm} onClose={() => setShowForm(false)} formName="Artwork Inquiry Form">
        <Field.Text name="firstName" placeholder="Answer" label="What's your first name?" required />
        <Field.Text name="lastName" placeholder="Answer" label="What's your last name?" required />
        <Field.Email name="email" placeholder="Answer" label="What's your email address?" required />
        <Field.Text name="message" placeholder="Answer" label="Would you like to leave any message?" />
      </FormSidePanel>
    </>
  );
};

export default ArtworkEnquiryForm;
