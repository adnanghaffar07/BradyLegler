'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import LogoVideo from '@/components/LogoVideo';
import Text from '@/components/Text';
import styles from './styles.module.scss';
import { motion } from 'framer-motion';

type FormThankYouProps = {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: {
    loading: string;
    success: string;
  };
};

const FormThankYou: React.FC<FormThankYouProps> = props => {
  const {
    status = 'idle',
    message = {
      loading: 'Your enquiry is processing...',
      success: 'Thank you for your enquiry.'
    }
  } = props;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (status === 'idle' || status === 'error') return null;

  const portalRoot = mounted ? document.getElementById('modal') : null;

  if (!portalRoot) return null;

  const isVisible = status === 'loading' || status === 'success';

  return createPortal(
    <div className={`${styles.container} ${isVisible ? styles.visible : ''}`}>
      <div className={styles.body}>
        <motion.div
          animate={status}
          initial={{ opacity: 0 }}
          variants={{
            idle: {
              opacity: 0
            },
            loading: {
              opacity: 0
            },
            success: {
              opacity: 1,
              transition: {
                delay: 0.5,
                duration: 0.5
              }
            },
            error: {
              opacity: 0
            }
          }}
        >
          <Text text={message.success} size="b1" />
        </motion.div>
      </div>

      <motion.div
        className={styles.footer}
        animate={status}
        initial={{ opacity: 0 }}
        variants={{
          idle: {
            opacity: 0
          },
          loading: {
            opacity: 1
          },
          success: {
            opacity: 0,
            transition: {
              duration: 0.5
            }
          },
          error: {
            opacity: 0
          }
        }}
      >
        <Text text={message.loading} size="b1" />
      </motion.div>
    </div>,
    portalRoot
  );
};

export default FormThankYou;
