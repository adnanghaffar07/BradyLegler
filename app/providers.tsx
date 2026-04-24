'use client';

import React from 'react';
import { ContactSidebarProvider } from '@/tools/hooks/useContactSidebar';
import EmailSubscriptionPopup from '@/components/EmailSubscriptionPopup';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ContactSidebarProvider>
      {children}
      <EmailSubscriptionPopup />
    </ContactSidebarProvider>
  );
};
