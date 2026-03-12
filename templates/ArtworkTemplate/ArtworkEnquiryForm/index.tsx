'use client';

import React, { useCallback } from 'react';
import Button from '@/components/Button';
import { useContactSidebar } from '@/tools/hooks/useContactSidebar';

type ArtworkEnquiryFormProps = {
  isOnSale: boolean;
};

const ArtworkEnquiryForm: React.FC<ArtworkEnquiryFormProps> = props => {
  const { isOnSale } = props;
  const { openContactSidebar } = useContactSidebar();

  const handleClick = useCallback(() => {
    if (isOnSale) {
      openContactSidebar();
    }
  }, [isOnSale, openContactSidebar]);

  return (
    <>
      <Button onClick={handleClick} text={isOnSale ? 'Inquire' : 'Sold'} disabled={!isOnSale} variant="square" />
    </>
  );
};

export default ArtworkEnquiryForm;
