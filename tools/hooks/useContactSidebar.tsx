'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ContactSidebarContextType {
  isOpen: boolean;
  openContactSidebar: () => void;
  closeContactSidebar: () => void;
}

const ContactSidebarContext = createContext<ContactSidebarContextType | undefined>(undefined);

export const ContactSidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openContactSidebar = () => setIsOpen(true);
  const closeContactSidebar = () => setIsOpen(false);

  return (
    <ContactSidebarContext.Provider value={{ isOpen, openContactSidebar, closeContactSidebar }}>
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
