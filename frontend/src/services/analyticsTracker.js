/**
 * Analytics Tracking Service
 * 
 * This service handles all analytics tracking for the public menu.
 * It tracks:
 * - User sessions
 * - Page views
 * - Item clicks
 * - Time on page
 * - User behavior
 */

import axios from 'axios';
import { getSubdomain } from '../utils/subdomain';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class AnalyticsTracker {
  constructor() {
    this.sessionId = null;
    this.pageStartTime = null;
    this.currentPage = null;
    this.subdomain = null; // Will be set dynamically
  }

  /**
   * Initialize analytics session
   */
  async initSession(language = 'en') {
    // Get subdomain dynamically
    this.subdomain = getSubdomain();
    
    if (!this.subdomain) {
      console.warn('[Analytics] No subdomain found, skipping session init');
      return;
    }
    
    try {
      console.log(`[Analytics] Initializing session for subdomain: ${this.subdomain}, language: ${language}`);
      const response = await axios.post(`${API_URL}/api/analytics/track/session`, null, {
        params: {
          subdomain: this.subdomain,
          language: language
        }
      });
      
      this.sessionId = response.data.session_id;
      console.log(`[Analytics] Session initialized with ID: ${this.sessionId}`);
      
      // Store session ID in sessionStorage for page reloads
      sessionStorage.setItem('analytics_session_id', this.sessionId);
      
      // Set up page unload handler
      this.setupUnloadHandler();
      
      return this.sessionId;
    } catch (error) {
      console.error('Failed to initialize analytics session:', error);
      console.error('Error details:', error.response?.data);
    }
  }

  /**
   * Get or create session
   */
  async getSession(language = 'en') {
    // Check if we have a session in storage
    const storedSessionId = sessionStorage.getItem('analytics_session_id');
    if (storedSessionId) {
      this.sessionId = storedSessionId;
      return this.sessionId;
    }
    
    // Otherwise create new session
    return await this.initSession(language);
  }

  /**
   * Track page view
   */
  async trackPageView(pageType, categoryId = null, itemId = null) {
    if (!this.sessionId) {
      await this.getSession();
    }
    
    if (!this.sessionId) return;
    
    // End tracking for previous page
    if (this.currentPage) {
      this.endPageTracking();
    }
    
    // Start tracking new page
    this.pageStartTime = new Date();
    this.currentPage = { pageType, categoryId, itemId };
    
    try {
      await axios.post(`${API_URL}/api/analytics/track/pageview`, null, {
        params: {
          session_id: this.sessionId,
          page_type: pageType,
          category_id: categoryId,
          item_id: itemId
        }
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  /**
   * Track item click
   */
  async trackItemClick(itemId, categoryId = null, actionType = 'view_details') {
    if (!this.sessionId) {
      console.log('[Analytics] No session ID, attempting to get/create session...');
      await this.getSession();
    }
    
    if (!this.sessionId) {
      console.error('[Analytics] Still no session ID after getSession, aborting tracking');
      return;
    }
    
    try {
      console.log(`[Analytics] Tracking item click: item=${itemId}, category=${categoryId}, session=${this.sessionId}`);
      await axios.post(`${API_URL}/api/analytics/track/item-click`, null, {
        params: {
          session_id: this.sessionId,
          item_id: itemId,
          category_id: categoryId,
          action_type: actionType
        }
      });
      console.log('[Analytics] Item click tracked successfully');
    } catch (error) {
      console.error('[Analytics] Failed to track item click:', error);
    }
  }

  /**
   * End page tracking and calculate time on page
   */
  endPageTracking() {
    if (!this.pageStartTime || !this.currentPage) return;
    
    const timeOnPage = Math.round((new Date() - this.pageStartTime) / 1000);
    
    // You could send this to the backend if needed
    // For now, we'll just log it
    console.log(`Time on page: ${timeOnPage} seconds`);
  }

  /**
   * End session
   */
  async endSession() {
    if (!this.sessionId) return;
    
    // End current page tracking
    this.endPageTracking();
    
    try {
      await axios.post(`${API_URL}/api/analytics/track/session-end`, null, {
        params: {
          session_id: this.sessionId
        }
      });
    } catch (error) {
      console.error('Failed to end session:', error);
    }
    
    // Clear session
    this.sessionId = null;
    sessionStorage.removeItem('analytics_session_id');
  }

  /**
   * Setup page unload handler to end session
   */
  setupUnloadHandler() {
    // Use beacon API for reliable tracking on page unload
    window.addEventListener('beforeunload', () => {
      if (this.sessionId) {
        // Beacon API doesn't support query params well, so we'll use a FormData approach
        const formData = new FormData();
        formData.append('session_id', this.sessionId);
        navigator.sendBeacon(`${API_URL}/api/analytics/track/session-end?session_id=${this.sessionId}`);
      }
    });
    
    // Also handle visibility change (mobile browsers)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.sessionId) {
        this.endPageTracking();
      }
    });
  }

  /**
   * Track scroll depth
   */
  trackScrollDepth() {
    let maxScroll = 0;
    
    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100
      );
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        
        // Track significant scroll milestones
        if (maxScroll >= 25 && maxScroll < 50) {
          console.log('User scrolled 25%');
        } else if (maxScroll >= 50 && maxScroll < 75) {
          console.log('User scrolled 50%');
        } else if (maxScroll >= 75 && maxScroll < 100) {
          console.log('User scrolled 75%');
        } else if (maxScroll >= 100) {
          console.log('User scrolled to bottom');
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }
}

// Create singleton instance
const analyticsTracker = new AnalyticsTracker();

export default analyticsTracker;