'use client';

import React, { useCallback } from 'react';
import Button from '@/components/Button';
import { useContactSidebar } from '@/tools/hooks/useContactSidebar';

type ArtworkEnquiryFormProps = {
  isOnSale: boolean;
  inquireButtonLabel?: string;
};

const ArtworkEnquiryForm: React.FC<ArtworkEnquiryFormProps> = props => {
  const { isOnSale, inquireButtonLabel } = props;
  const { openContactSidebar } = useContactSidebar();
  const buttonLabel = inquireButtonLabel?.trim() || 'Inquire';

  const handleClick = useCallback(() => {
    if (isOnSale) {
      openContactSidebar();
    }
  }, [isOnSale, openContactSidebar]);

  return (
    <>
      <Button onClick={handleClick} text={isOnSale ? buttonLabel : 'Sold'} disabled={!isOnSale} variant="square" />
    </>
  );
};

export default ArtworkEnquiryForm;
