'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import classNames from '@/helpers/classNames';
import Icon from '@/components/Icon';
import Text from '../Text';
import Button from '../Button';
import styles from './styles.module.scss';

interface ModalProps {
  show: boolean;
  onClose: (show: boolean) => void;
  children: React.ReactNode;
  className?: string;
  modalClassName?: string;
  title?: string;
  showHeader?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'full';
  align?: 'left' | 'center' | 'right';
  from?: 'left' | 'top' | 'right' | 'bottom';
  mountModal?: boolean;
  removeBackdrop?: boolean;
  customAnimations?: { [key: string]: { [key: string]: any } };
}

const Modal = (props: ModalProps) => {
  const {
    show = true,
    onClose,
    showHeader = false,
    title,
    children,
    className,
    modalClassName,
    from = 'top',
    size,
    align,
    mountModal = false,
    removeBackdrop = false,
    customAnimations
  } = props;
  const [mounted, setMounted] = useState(false);

  const animations = customAnimations || {
    opacityHidden: {
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    },
    opacityVisible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    },
    slideInHidden: {
      opacity: 0,
      ...{
        left: {
          x: '-4%',
          y: 0
        },
        top: {
          x: 0,
          y: '-4%'
        },
        right: {
          x: '4%',
          y: 0
        },
        bottom: {
          x: 0,
          y: '4%'
        }
      }[from]
    },
    slideInVisible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    }
  };

  const onCloseHandler = useCallback(() => {
    if (onClose) onClose(false);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseHandler();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCloseHandler]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [show]);

  const portalRoot = mounted ? document.getElementById('modal') : null;

  if (!portalRoot) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {(show || mountModal) && (
        <motion.div
          className={classNames(
            styles.modal,
            { [styles.show]: show },
            { [styles.removeBackdrop]: removeBackdrop },
            { show: show },
            modalClassName
          )}
          variants={animations}
          initial="opacityHidden"
          animate="opacityVisible"
          exit="opacityHidden"
        >
          <div className={styles.wrapper}>
            <motion.div
              className={classNames(
                'container',
                styles.container,
                styles[`size_${size}`],
                styles[`align_${align}`],
                className
              )}
              variants={animations}
              initial="slideInHidden"
              animate="slideInVisible"
              exit="slideInHidden"
            >
              {showHeader && (
                <div className={styles.header}>
                  <Text text={title} />
                  <Button onClick={onCloseHandler} ariaLabel="Close Modal">
                    <Icon title="close" size="md" />
                  </Button>
                </div>
              )}
              <div className={styles.content}>{children}</div>
            </motion.div>
          </div>
          <div className={classNames(styles.overlay, 'overlay')} onClick={onCloseHandler} />
        </motion.div>
      )}
    </AnimatePresence>,
    portalRoot
  );
};

export default Modal;
