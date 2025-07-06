/**
 * Performance monitoring utility
 * Tracks and logs performance metrics for optimization
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoadTime: null,
      firstContentfulPaint: null,
      largestContentfulPaint: null,
      timeToInteractive: null,
      totalBlockingTime: null,
      cumulativeLayoutShift: null
    };
    
    this.initializeMonitoring();
  }

  initializeMonitoring() {
    // Track page load time
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        const timing = window.performance.timing;
        this.metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
        console.log(`Page Load Time: ${this.metrics.pageLoadTime}ms`);
      });
    }

    // Track Core Web Vitals
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.firstContentfulPaint = Math.round(entry.startTime);
              console.log(`First Contentful Paint: ${this.metrics.firstContentfulPaint}ms`);
            }
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.error('FCP Observer error:', e);
      }

      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.largestContentfulPaint = Math.round(lastEntry.startTime);
          console.log(`Largest Contentful Paint: ${this.metrics.largestContentfulPaint}ms`);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.error('LCP Observer error:', e);
      }

      // Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.metrics.cumulativeLayoutShift = clsValue;
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.error('CLS Observer error:', e);
      }
    }
  }

  // Get current metrics
  getMetrics() {
    return { ...this.metrics };
  }

  // Log all metrics
  logMetrics() {
    console.group('Performance Metrics');
    Object.entries(this.metrics).forEach(([key, value]) => {
      if (value !== null) {
        console.log(`${key}: ${value}${key.includes('Shift') ? '' : 'ms'}`);
      }
    });
    console.groupEnd();
  }

  // Check if metrics meet performance budget
  checkPerformanceBudget(budget = {
    pageLoadTime: 3000,
    firstContentfulPaint: 1800,
    largestContentfulPaint: 2500,
    cumulativeLayoutShift: 0.1
  }) {
    const issues = [];
    
    Object.entries(budget).forEach(([metric, threshold]) => {
      if (this.metrics[metric] !== null && this.metrics[metric] > threshold) {
        issues.push({
          metric,
          actual: this.metrics[metric],
          budget: threshold,
          exceeded: this.metrics[metric] - threshold
        });
      }
    });

    if (issues.length > 0) {
      console.warn('Performance budget exceeded:', issues);
    }

    return issues;
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export for use in development
if (process.env.NODE_ENV === 'development') {
  window.performanceMonitor = performanceMonitor;
}

export default performanceMonitor;