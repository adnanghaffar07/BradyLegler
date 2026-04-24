'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import FormNewsletter from '@/components/Form/FormNewsletter';
import Text from '@/components/Text';
import styles from './styles.module.scss';

interface EmailSubscriptionPopupProps {
  title?: string;
  subtitle?: string;
  delay?: number;
}

const EmailSubscriptionPopup: React.FC<EmailSubscriptionPopupProps> = ({
  title = 'Join to join us or private access',
  subtitle = 'Be the first to experience new collections, private events, and stories behind the work.',
  delay = 3000,
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [popupStatus, setPopupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [popupMessage, setPopupMessage] = useState('');

  useEffect(() => {
    setIsClient(true);

    const hasShown = localStorage.getItem('emailPopupShown');

    if (!hasShown) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [delay]);

  const handleClose = () => {
    localStorage.setItem('emailPopupShown', 'true');
    setShowPopup(false);
    setPopupStatus('idle');
    setPopupMessage('');
  };

  const handleSuccess = () => {
    localStorage.setItem('emailPopupShown', 'true');
    setShowPopup(false);
    setPopupStatus('idle');
    setPopupMessage('');
  };

  const handleStatusChange = (status: 'idle' | 'loading' | 'success' | 'error', message?: string) => {
    setPopupStatus(status);
    setPopupMessage(message || '');
  };

  if (!isClient) {
    return null;
  }

  return (
    <Modal
      show={showPopup}
      onClose={handleClose}
      showHeader={false}
      size="sm"
      align="center"
      from="top"
    >
      <div className={styles.popup}>
        <button onClick={handleClose} className={styles.closeBtn} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className={styles.contentWrapper}>
          <div className={styles.content}>
            <div className={styles.iconContainer}>
             <img src="/svg-logo.svg" alt="Brady Logo" className={styles.icon} />
            </div>

            {/* <h2 className={styles.title}>{title}</h2> */}
            <p className={styles.subtitle}>{subtitle}</p>

            <div className={styles.formSection}>
              {popupStatus === 'success' ? (
                <div className={styles.successState}>
                  <svg className={styles.checkmark} viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <p className={styles.statusMessage}>{popupMessage || 'Thank you for subscribing!'}</p>
                </div>
              ) : (
                <FormNewsletter
                  onSuccess={() => {
                    handleSuccess();
                  }}
                  onStatusChange={handleStatusChange}
                  showThankYouOverlay={false}
                />
              )}
              {popupStatus === 'error' && (
                <div className={styles.errorState}>
                  <p className={styles.errorMessage}>{popupMessage || 'Subscription failed. Please try again.'}</p>
                </div>
              )}
            </div>

            {popupStatus !== 'success' && (
              <button onClick={handleClose} className={styles.declineBtn}>
                No thanks, I&apos;m not interested
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EmailSubscriptionPopup;