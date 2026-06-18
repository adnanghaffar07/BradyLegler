'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Text from '../Text';
import Button from '../Button';
import classNames from '@/tools/helpers/classNames';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';
import styles from './styles.module.scss';

type SidePanelProps = {
  title: string;
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
  trapFocus?: boolean;
  closeOnEscape?: boolean;
  ariaLabel?: string;
  zIndex?: number;
};

export const SIDE_PANEL_Z_INDEX = {
  base: 10000,
  elevated: 10002
} as const;

const SidePanelBody = (props: { children: React.ReactNode }) => {
  const { children } = props;
  return <div className={styles.body}>{children}</div>;
};

const SidePanelFooter = (props: { children: React.ReactNode; className?: string }) => {
  const { children, className } = props;
  return <div className={classNames(styles.footer, className)}>{children}</div>;
};

const SidePanel = (props: SidePanelProps) => {
  const {
    title,
    show,
    onClose,
    children,
    trapFocus = false,
    closeOnEscape = false,
    ariaLabel,
    zIndex = SIDE_PANEL_Z_INDEX.base
  } = props;

  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (!document.getElementById('modal')) {
      const modalDiv = document.createElement('div');
      modalDiv.setAttribute('id', 'modal');
      document.body.appendChild(modalDiv);
    }
  }, []);

  useEffect(() => {
    if (!show) {
      return;
    }

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, [show]);

  useEffect(() => {
    if (!show || (!trapFocus && !closeOnEscape)) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    firstFocusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
        return;
      }

      if (!trapFocus || event.key !== 'Tab' || focusableElements.length === 0) {
        return;
      }

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [show, trapFocus, closeOnEscape, onClose]);

  if (!mounted) return null;

  const modalRoot = document.getElementById('modal');
  if (!modalRoot) return null;

  return createPortal(
    <>
      <div
        className={classNames(styles.overlay, { [styles.visible]: show })}
        style={{ zIndex: zIndex - 1 }}
        onClick={onClose}
      />
      <div
        ref={containerRef}
        className={classNames(styles.container, { [styles.open]: show })}
        style={{ zIndex }}
        role={trapFocus ? 'dialog' : undefined}
        aria-modal={trapFocus ? true : undefined}
        aria-label={ariaLabel || title}
      >
        <div className={styles.header}>
          <Text text={title} size="b2" />
          <Button onClick={onClose} variant="normal-sm">
            Close
          </Button>
        </div>

        {children}
      </div>
    </>,
    modalRoot
  );
};

SidePanel.Body = SidePanelBody;
SidePanel.Footer = SidePanelFooter;

export default SidePanel;
