/**
 * Meta Pixel Debug Utility
 *
 * Use this in your browser console to verify Meta Pixel integration:
 * 
 * Example:
 * 1. Open browser DevTools (F12)
 * 2. Go to Console tab
 * 3. Copy and paste the code below
 * 4. Run commands like: debugMeta.checkPixelStatus()
 */

export const debugMeta = {
  /**
   * Check overall Meta Pixel status
   */
  checkPixelStatus(): void {
    console.group('🔍 Meta Pixel Status Check');
    
    // Check fbq availability
    const hasFbq = typeof window !== 'undefined' && !!window.fbq;
    console.log('✓ fbq available:', hasFbq);
    
    // Check FBP cookie
    const fbp = this.getFbpCookie();
    console.log('✓ _fbp cookie:', fbp ? `${fbp.substring(0, 20)}...` : '❌ NOT FOUND');
    
    // Check FBC cookie
    const fbc = this.getFbcCookie();
    console.log('✓ _fbc cookie:', fbc ? `${fbc.substring(0, 20)}...` : '❌ NOT FOUND');
    
    // Check fbclid URL parameter
    const fbclid = this.getFbclidParam();
    console.log('✓ fbclid param:', fbclid ? `${fbclid.substring(0, 20)}...` : '❌ NOT FOUND');
    
    // Check pixel ID
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    console.log('✓ Pixel ID configured:', pixelId ? '✅ YES' : '❌ NO');
    
    // Check test code
    const testCode = process.env.META_TEST_EVENT_CODE;
    console.log('✓ Test event code:', testCode ? '✅ YES (Testing mode)' : '❌ NO (Production mode)');
    
    console.groupEnd();
  },

  /**
   * Get FBP cookie value
   */
  getFbpCookie(): string | undefined {
    if (typeof document === 'undefined') return undefined;
    const name = '_fbp=';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name)) {
        return cookie.substring(name.length);
      }
    }
    return undefined;
  },

  /**
   * Get FBC cookie value
   */
  getFbcCookie(): string | undefined {
    if (typeof document === 'undefined') return undefined;
    const name = '_fbc=';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name)) {
        return cookie.substring(name.length);
      }
    }
    return undefined;
  },

  /**
   * Get fbclid URL parameter
   */
  getFbclidParam(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    const params = new URLSearchParams(window.location.search);
    return params.get('fbclid') || undefined;
  },

  /**
   * Simulate a test event to verify CAPI connection
   */
  async sendTestEvent(eventName: string = 'PageView'): Promise<void> {
    console.log(`📤 Sending test ${eventName} event...`);
    
    try {
      const response = await fetch('/api/meta/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: eventName,
          event_id: this.generateEventId(),
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: window.location.href,
          action_source: 'website',
          user_data: {
            fbp: this.getFbpCookie(),
            fbc: this.getFbcCookie() || this.generateFbcFromFbclid(),
          },
          custom_data: {
            currency: 'USD',
            value: 0,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Event sent successfully:', data);
      } else {
        const error = await response.json();
        console.error('❌ Error sending event:', error);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
    }
  },

  /**
   * Check cookies for Meta integration
   */
  checkCookies(): void {
    console.group('🍪 Cookie Analysis');
    
    const allCookies = document.cookie.split(';').map(c => c.trim());
    const metaCookies = allCookies.filter(c => c.startsWith('_fb') || c.startsWith('_gid') || c.startsWith('_ga'));
    
    console.log('All Meta-related cookies:');
    metaCookies.forEach(cookie => {
      const [key, value] = cookie.split('=');
      console.log(`  ${key}: ${value.substring(0, 30)}...`);
    });
    
    if (metaCookies.length === 0) {
      console.warn('⚠️ No Meta cookies found. Pixel may not be loaded.');
    }
    
    console.groupEnd();
  },

  /**
   * Get browser/device info for debugging
   */
  getDeviceInfo(): void {
    console.group('📱 Browser & Device Info');
    
    console.log('User Agent:', navigator.userAgent);
    console.log('Platform:', navigator.platform);
    console.log('Language:', navigator.language);
    console.log('Cookies Enabled:', navigator.cookieEnabled);
    console.log('Secure Connection:', window.location.protocol === 'https:');
    console.log('Hostname:', window.location.hostname);
    
    console.groupEnd();
  },

  /**
   * Test pixel tracking functions
   */
  testPixelTracking(): void {
    if (!window.fbq) {
      console.error('❌ fbq is not available. Pixel not loaded.');
      return;
    }
    
    console.log('📊 Testing Pixel Tracking...');
    
    // Test different event types
    const events = [
      { name: 'PageView', data: {} },
      { name: 'ViewContent', data: { content_id: 'test-123', content_type: 'product' } },
      { name: 'AddToCart', data: { content_id: 'test-123', value: 99.99, currency: 'USD' } },
    ];
    
    events.forEach(event => {
      try {
        window.fbq('track', event.name, event.data);
        console.log(`✓ ${event.name} tracked`);
      } catch (error) {
        console.error(`✗ ${event.name} failed:`, error);
      }
    });
  },

  /**
   * Generate event ID
   */
  generateEventId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  /**
   * Generate FBC from fbclid
   */
  generateFbcFromFbclid(): string | undefined {
    const fbclid = this.getFbclidParam();
    if (!fbclid) return undefined;
    const timestamp = Math.floor(Date.now() / 1000);
    return `fb.1.${timestamp}.${fbclid}`;
  },

  /**
   * Monitor all CAPI requests
   */
  monitorApiRequests(): void {
    const originalFetch = window.fetch;
    
    window.fetch = function(...args: any[]) {
      const [resource] = args;
      
      if (typeof resource === 'string' && resource.includes('/api/meta/events')) {
        console.log(`📤 Meta CAPI Request:`, args[1]?.body);
      }
      
      return originalFetch.apply(this, args);
    } as any;
    
    console.log('✓ API request monitoring enabled');
  },

  /**
   * Full diagnostic report
   */
  fullDiagnostic(): void {
    console.log('%c🔧 FULL META PIXEL DIAGNOSTIC REPORT', 'font-size: 16px; font-weight: bold; color: #1877F2;');
    console.log('');
    
    this.checkPixelStatus();
    console.log('');
    this.checkCookies();
    console.log('');
    this.getDeviceInfo();
    console.log('');
    
    console.log('%cTo test event tracking, run: debugMeta.sendTestEvent()', 'color: #1877F2; font-weight: bold');
    console.log('%cTo monitor API requests, run: debugMeta.monitorApiRequests()', 'color: #1877F2; font-weight: bold');
  },
};

// Expose to window in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugMeta = debugMeta;
}
