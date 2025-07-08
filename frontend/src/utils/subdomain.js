// Utility to get subdomain from current URL
export const getSubdomain = () => {
  const hostname = window.location.hostname;
  
  // For localhost development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return localStorage.getItem('dev_subdomain') || 'demo';
  }
  
  // For production
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    // e.g., demo.menuiq.io -> demo
    return parts[0];
  }
  
  // Default subdomain
  return 'demo';
};

// Set subdomain for development
export const setDevSubdomain = (subdomain) => {
  localStorage.setItem('dev_subdomain', subdomain);
};