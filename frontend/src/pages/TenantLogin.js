import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Lock, Mail, AlertCircle, Building2 } from 'lucide-react';

const TenantLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tenantInfo, setTenantInfo] = useState(null);
  const [isMainDomain, setIsMainDomain] = useState(false);
  const { tenantLogin } = useAuth();

  useEffect(() => {
    // Get subdomain from URL
    const hostname = window.location.hostname;
    let subdomain = '';
    
    if (hostname.includes('.menuiq.io')) {
      subdomain = hostname.split('.')[0];
    } else if (hostname === 'localhost') {
      // For local testing, use a query parameter or default to 'demo'
      const params = new URLSearchParams(window.location.search);
      subdomain = params.get('tenant') || 'demo';
    }
    
    if (subdomain && subdomain !== 'www' && subdomain !== 'menuiq') {
      // In production, you would fetch tenant info from API
      setTenantInfo({
        subdomain,
        name: subdomain.charAt(0).toUpperCase() + subdomain.slice(1) + ' Restaurant'
      });
    } else if (hostname === 'menuiq.io' || hostname === 'www.menuiq.io') {
      // On main domain, show a general login form
      setIsMainDomain(true);
      setTenantInfo({
        subdomain: '',
        name: 'MenuIQ'
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const tenantSubdomain = isMainDomain ? subdomain : tenantInfo?.subdomain;

    if (!tenantSubdomain) {
      setError('Please enter your restaurant subdomain');
      setLoading(false);
      return;
    }

    const result = await tenantLogin(email, password, tenantSubdomain);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  if (!tenantInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Restaurant Logo/Name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4">
            <Building2 className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{tenantInfo.name}</h1>
          <p className="text-gray-600">Restaurant Management Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">
            Welcome Back
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subdomain Input (only on main domain) */}
            {isMainDomain && (
              <div>
                <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Subdomain
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="subdomain"
                    type="text"
                    required
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                    className="block w-full pl-10 pr-24 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="yourrestaurant"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">.menuiq.io</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">Enter your restaurant's subdomain</p>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <button type="button" className="text-sm text-indigo-600 hover:text-indigo-700">
                Forgot your password?
              </button>
            </div>
          </form>
        </div>

        {/* Guest Menu Link */}
        <div className="mt-6 text-center">
          <a 
            href="/" 
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            View guest menu →
          </a>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Powered by{' '}
            <a href="https://menuiq.io" className="text-indigo-600 hover:text-indigo-700">
              MenuIQ
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TenantLogin;