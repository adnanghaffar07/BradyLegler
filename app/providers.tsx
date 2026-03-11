'use client';

import React from 'react';
import { ContactSidebarProvider } from '@/tools/hooks/useContactSidebar';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ContactSidebarProvider>{children}</ContactSidebarProvider>;
};
