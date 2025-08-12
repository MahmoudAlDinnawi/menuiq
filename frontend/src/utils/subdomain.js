// Utility to get subdomain from current URL
export const getSubdomain = () => {
  const hostname = window.location.hostname;
  
  // For localhost development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // First check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlSubdomain = urlParams.get('subdomain');
    if (urlSubdomain) {
      // console.log('[Subdomain] Using subdomain from URL parameter:', urlSubdomain);
      // Also save it to localStorage for consistency
      localStorage.setItem('dev_subdomain', urlSubdomain);
      return urlSubdomain;
    }
    
    // Fall back to localStorage
    const devSubdomain = localStorage.getItem('dev_subdomain') || 'demo';
    // console.log('[Subdomain] Using dev subdomain from localStorage:', devSubdomain);
    return devSubdomain;
  }
  
  // For production
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    // e.g., demo.menuiq.io -> demo
    const subdomain = parts[0];
    // console.log('[Subdomain] Extracted from hostname:', subdomain);
    return subdomain;
  }
  
  // Default subdomain
  // console.log('[Subdomain] Using default: demo');
  return 'demo';
};

// Set subdomain for development
export const setDevSubdomain = (subdomain) => {
  localStorage.setItem('dev_subdomain', subdomain);
};