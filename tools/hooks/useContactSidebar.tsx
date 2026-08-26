'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

type OpenContactSidebarOptions = {
  prefill?: string;
  startOnForm?: boolean;
};

interface ContactSidebarContextType {
  isOpen: boolean;
  prefill: string;
  startOnForm: boolean;
  openContactSidebar: (options?: OpenContactSidebarOptions) => void;
  closeContactSidebar: () => void;
}

const ContactSidebarContext = createContext<ContactSidebarContextType | undefined>(undefined);

export const ContactSidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState('');
  const [startOnForm, setStartOnForm] = useState(false);

  const openContactSidebar = (options?: OpenContactSidebarOptions) => {
    setPrefill(options?.prefill ?? '');
    setStartOnForm(options?.startOnForm ?? false);
    setIsOpen(true);
  };
  const closeContactSidebar = () => setIsOpen(false);

  return (
    <ContactSidebarContext.Provider
      value={{ isOpen, prefill, startOnForm, openContactSidebar, closeContactSidebar }}
    >
      {children}
    </ContactSidebarContext.Provider>
  );
};

export const useContactSidebar = () => {
  const context = useContext(ContactSidebarContext);
  if (context === undefined) {
    throw new Error('useContactSidebar must be used within a ContactSidebarProvider');
  }
  return context;
};
