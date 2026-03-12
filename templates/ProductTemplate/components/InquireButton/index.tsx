'use client';

import React from 'react';
import Button from '@/components/Button';
import { useContactSidebar } from '@/tools/hooks/useContactSidebar';

type InquireButtonProps = {
  label?: string;
};

const InquireButton: React.FC<InquireButtonProps> = ({ label = 'Inquire' }) => {
  const { openContactSidebar } = useContactSidebar();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    openContactSidebar();
  };

  return (
    <Button type="button" variant="square" onClick={handleClick}>
      {label}
    </Button>
  );
};

export default InquireButton;
