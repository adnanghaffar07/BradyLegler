'use client';

import React, { useState, useEffect } from 'react';
import classNames from '@/helpers/classNames';
import Icon from '@/components/Icon';
import styles from './ContactSidebar.module.scss';

interface ContactSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  enquiry: string;
  contactMethod: string;
}

const ContactSidebar: React.FC<ContactSidebarProps> = ({ isOpen, onClose }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    enquiry: '',
    contactMethod: 'email'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContactMethodChange = (method: string) => {
    setFormData(prev => ({ ...prev, contactMethod: method }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Send to your API endpoint which will forward to Klaviyo
      const response = await fetch('/api/form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'enquiry',
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone, // Make sure this is included
          contactMethod: formData.contactMethod, // Make sure this is included
          message: formData.enquiry, // This should map to the enquiry field
          formName: 'Contact Sidebar Form'
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        setSubmitStatus({
          type: 'success',
          message: 'Thank you! Your enquiry has been submitted successfully.'
        });

        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          enquiry: '',
          contactMethod: 'email'
        });

        // Auto-close form after success
        setTimeout(() => {
          setShowForm(false);
          setSubmitStatus(null);
        }, 3000);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      setSubmitStatus({
        type: 'error',
        message: error.message || 'Failed to submit your enquiry. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus(null), 5000);
    }
  };

  const handleContactButtonClick = (action: string) => {
    switch (action) {
      case 'enquiry':
        // Handled by showForm state
        break;
      case 'message':
        // TODO: Open a message modal or link
        break;
      case 'call':
        window.location.href = 'tel:6465904747';
        break;
      case 'find-store':
        // TODO: Navigate to store locator
        break;
      case 'press':
        window.location.href = 'mailto:fs@jessicamccormack.com';
        break;
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      enquiry: '',
      contactMethod: 'email'
    });
    setSubmitStatus(null);
    onClose();
  };

  // Prevent body scroll when contact sidebar is open
  useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Apply styles to lock scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Remove scroll lock styles
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div 
        className={classNames(styles.overlay, styles.contactOverlay, {
          [styles.overlayVisible]: isOpen
        })} 
        onClick={handleClose}
        style={{ 
          pointerEvents: isOpen ? 'auto' : 'none',
          opacity: isOpen ? 1 : 0
        }}
      />
      {/* Sidebar */}
      <div
        className={classNames(styles.sidebarRight, {
          [styles.sidebarOpen]: isOpen
        })}
      >
        <div className={styles.sidebarContent}>
          <div className={styles.contactSidebarInner}>
            {/* When showing form, hide the header and description */}
            {!showForm ? (
              <>
                {/* Header with cross button - only shown when not in form */}
                <div className={styles.contactHeader}>
                  <h2 className={styles.contactHeading}>Contact Us</h2>
                  <button className={styles.closeButton} onClick={handleClose} aria-label="Close contact sidebar">
                    <Icon title="close" className={styles.closeIcon} />
                  </button>
                </div>

                {/* Contact Description - only shown when not in form */}
                <p className={styles.contactDescription}>
                  Our team of experts is available to answer all your questions from assistance with your orders to
                  style advice and gift ideas.
                </p>

                {/* STEP 1: Show action buttons (default view) */}
                <div className={styles.contactActions}>
                  <div className={styles.inquirySection}>
                    <strong className={styles.inquiryTitle}>Make an Enquiry</strong>
                    <button className={styles.messageButton} onClick={() => setShowForm(true)}>
                      Send us a Message
                    </button>
                  </div>

                  <div className={styles.contactOptions}>
                    <button className={styles.contactOptionBtn} onClick={() => handleContactButtonClick('call')}>
                      <span className={styles.optionMainText}>Call Us (646) 590-4747</span>
                      <span className={styles.optionSubText}>Monday to Saturday 10am to 6pm</span>
                    </button>

                    {/* <button className={styles.contactOptionBtn} onClick={() => handleContactButtonClick('find-store')}>
                      <span className={styles.optionMainText}>Find a Store</span>
                    </button> */}

                    <button className={styles.contactOptionBtn} onClick={() => handleContactButtonClick('press')}>
                      <div className={styles.pressTitle}>Press Enquiries</div>
                      <div className={styles.pressText}>
                        If you would like to discuss press enquiries, please contact:
                        <a href="mailto:info@bradylegler.com" className={styles.emailLink}>
                          info@bradylegler.com
                        </a>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* STEP 2: Show enquiry form */
              <div className={styles.enquiryFormSection}>
                {/* Back button to return to action buttons */}
                <button className={styles.backButton} onClick={() => setShowForm(false)}>
                  <Icon title="chevronLeft" className={styles.backIcon} />
                  Back to Contact Options
                </button>

                <h3 className={styles.formHeading}>
                  Please send an enquiry and one of our experts will get back to you as soon as possible.
                </h3>

                {/* Status Messages */}
                {submitStatus && (
                  <div
                    className={classNames(styles.statusMessage, {
                      [styles.success]: submitStatus.type === 'success',
                      [styles.error]: submitStatus.type === 'error'
                    })}
                  >
                    {submitStatus.message}
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className={styles.enquiryForm}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="firstName">First Name</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleFormChange}
                        required
                        className={styles.formInput}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="lastName">Last Name</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleFormChange}
                        required
                        className={styles.formInput}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="email">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        required
                        className={styles.formInput}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="phone">Phone</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleFormChange}
                        className={styles.formInput}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="enquiry">Your Enquiry</label>
                    <textarea
                      id="enquiry"
                      name="enquiry"
                      value={formData.enquiry}
                      onChange={handleFormChange}
                      placeholder="Let us know how we can help..."
                      required
                      className={styles.formTextarea}
                      rows={1}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className={styles.contactMethodGroup}>
                    <label className={styles.contactMethodLabel}>How would you like us to contact you?</label>
                    <div className={styles.contactMethodOptions}>
                      <button
                        type="button"
                        className={classNames(styles.contactMethodBtn, {
                          [styles.active]: formData.contactMethod === 'phone'
                        })}
                        onClick={() => handleContactMethodChange('phone')}
                        disabled={isSubmitting}
                      >
                        Phone
                      </button>
                      <button
                        type="button"
                        className={classNames(styles.contactMethodBtn, {
                          [styles.active]: formData.contactMethod === 'email'
                        })}
                        onClick={() => handleContactMethodChange('email')}
                        disabled={isSubmitting}
                      >
                        Email
                      </button>
                      {/* <button
                        type="button"
                        className={classNames(styles.contactMethodBtn, {
                          [styles.active]: formData.contactMethod === 'whatsapp'
                        })}
                        onClick={() => handleContactMethodChange('whatsapp')}
                        disabled={isSubmitting}
                      >
                        WhatsApp
                      </button> */}
                    </div>
                  </div>

                  <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactSidebar;
