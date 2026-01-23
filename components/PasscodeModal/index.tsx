'use client';

import { useState, useEffect, useRef } from 'react';
import classNames from '@/helpers/classNames';
import styles from './styles.module.scss';

interface PasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPasscode: string;
  menuTitle: string;
}

const PasscodeModal: React.FC<PasscodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  correctPasscode,
  menuTitle
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setError(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passcode.trim()) return;
    
    if (passcode === correctPasscode) {
      // Store successful verification in sessionStorage
      sessionStorage.setItem(`vip_access_${menuTitle}`, 'true');
      onSuccess();
      setPasscode('');
      setError(false);
    } else {
      setError(true);
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        inputRef.current?.focus();
      }, 400);
      setPasscode('');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={classNames(styles.modal, { [styles.shake]: isShaking })}>
        <button 
          type="button"
          className={styles.closeButton} 
          onClick={onClose} 
          aria-label="Close modal"
        >
          ×
        </button>

        <div className={styles.content}>
          <div className={styles.header}>
            <h2 className={styles.title}>VIP Access</h2>
            <p className={styles.subtitle}>Enter passcode to access {menuTitle}</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              ref={inputRef}
              type="password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError(false);
              }}
              className={classNames(styles.input, { [styles.error]: error })}
              placeholder="Passcode"
              autoComplete="off"
            />
            
            {error && (
              <p className={styles.errorMessage}>Incorrect passcode</p>
            )}

            <button type="submit" className={styles.submitButton} disabled={!passcode.trim()}>
              Enter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasscodeModal;
