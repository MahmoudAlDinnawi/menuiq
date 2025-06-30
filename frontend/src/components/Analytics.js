/**
 * Analytics Dashboard Component
 * 
 * Displays comprehensive analytics for restaurant owners including:
 * - Session and visitor metrics
 * - Popular items and categories
 * - Time-based trends
 * - Device breakdown
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Create axios instance with auth
const analyticsAPI = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
analyticsAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30); // Days
  const [overview, setOverview] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [deviceDetails, setDeviceDetails] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      
      // Fetch all analytics data
      const [overviewData, timelineData, topItemsData, categoryData] = await Promise.all([
        analyticsAPI.get('/api/analytics/dashboard/overview', {
          params: {
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0]
          }
        }),
        analyticsAPI.get('/api/analytics/dashboard/timeline', {
          params: { days: dateRange }
        }),
        analyticsAPI.get('/api/analytics/dashboard/top-items', {
          params: { days: dateRange, limit: 10 }
        }),
        analyticsAPI.get('/api/analytics/dashboard/category-performance', {
          params: { days: dateRange }
        })
      ]);
      
      setOverview(overviewData.data.overview);
      setTimeline(timelineData.data.timeline);
      setTopItems(topItemsData.data.top_items);
      setCategoryPerformance(categoryData.data.categories);
      
      // Process device details for enhanced display
      if (overviewData.data.overview?.device_breakdown) {
        const breakdown = overviewData.data.overview.device_breakdown;
        const total = (breakdown.mobile || 0) + (breakdown.desktop || 0) + (breakdown.tablet || 0);
        setDeviceDetails([
          {
            type: 'Mobile',
            count: breakdown.mobile || 0,
            percentage: total > 0 ? ((breakdown.mobile || 0) / total * 100).toFixed(1) : 0,
            icon: '📱',
            color: 'bg-blue-500'
          },
          {
            type: 'Desktop',
            count: breakdown.desktop || 0,
            percentage: total > 0 ? ((breakdown.desktop || 0) / total * 100).toFixed(1) : 0,
            icon: '💻',
            color: 'bg-green-500'
          },
          {
            type: 'Tablet',
            count: breakdown.tablet || 0,
            percentage: total > 0 ? ((breakdown.tablet || 0) / total * 100).toFixed(1) : 0,
            icon: '📱',
            color: 'bg-orange-500'
          }
        ]);
      }
      
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format numbers with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num || 0);
  };

  // Format duration to human-readable
  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  // Prepare chart data
  const getTimelineChartData = () => {
    const labels = timeline.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Sessions',
          data: timeline.map(d => d.sessions),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Page Views',
          data: timeline.map(d => d.page_views),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    };
  };

  const getDeviceChartData = () => {
    if (!overview) {
      console.log('No overview data yet');
      return null;
    }
    
    const deviceData = overview.device_breakdown || {};
    console.log('Device data from overview:', deviceData);
    
    const hasData = (deviceData.mobile || 0) + (deviceData.desktop || 0) + (deviceData.tablet || 0) > 0;
    console.log('Total device count:', (deviceData.mobile || 0) + (deviceData.desktop || 0) + (deviceData.tablet || 0));
    
    // If no data at all, show a message
    if (!hasData) {
      console.log('No device data to display');
      return null;
    }
    
    const chartData = {
      labels: ['Mobile', 'Desktop', 'Tablet'],
      datasets: [{
        data: [
          deviceData.mobile || 0,
          deviceData.desktop || 0,
          deviceData.tablet || 0
        ],
        backgroundColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(251, 146, 60)'
        ],
        borderWidth: 0
      }]
    };
    
    console.log('Chart data prepared:', chartData);
    return chartData;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 pb-8">
        {/* Header with Date Range Selector */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-sm text-gray-500">Today: {formatNumber(overview.today_sessions)}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Total Sessions</h3>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(overview.total_sessions)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Page Views</h3>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(overview.total_page_views)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Item Clicks</h3>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(overview.total_item_clicks)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Avg. Session Time</h3>
            <p className="text-2xl font-bold text-gray-900">{formatDuration(overview.avg_session_duration)}</p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Over Time</h3>
          <div style={{ height: '300px', position: 'relative' }}>
            {timeline.length > 0 && (
              <Line 
                data={getTimelineChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Types</h3>
          <div style={{ height: '300px', position: 'relative' }}>
            {overview && getDeviceChartData() ? (
              <>
                <div className="mb-4">
                  <Doughnut
                    data={getDeviceChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              let label = context.label || '';
                              if (label) {
                                label += ': ';
                              }
                              const value = context.parsed;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                              label += value + ' (' + percentage + '%)';
                              return label;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
                {/* Custom Legend with Details */}
                <div className="mt-4 space-y-2">
                  {deviceDetails.map((device, index) => (
                    <div key={device.type} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{device.icon}</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${device.color}`}></div>
                          <span className="font-medium text-gray-700">{device.type}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-gray-900">{formatNumber(device.count)}</span>
                        <span className="text-sm text-gray-500 ml-1">({device.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                {/* Placeholder chart */}
                <div className="relative w-48 h-48 mb-4">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full border-8 border-gray-100"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-300">0</p>
                      <p className="text-sm text-gray-400">sessions</p>
                    </div>
                  </div>
                </div>
                {/* Legend placeholder */}
                <div className="space-y-2 w-full">
                  {[
                    { type: 'Mobile', icon: '📱', color: 'bg-gray-200' },
                    { type: 'Desktop', icon: '💻', color: 'bg-gray-200' },
                    { type: 'Tablet', icon: '📱', color: 'bg-gray-200' }
                  ].map((device) => (
                    <div key={device.type} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="text-xl opacity-50">{device.icon}</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${device.color}`}></div>
                          <span className="text-gray-400">{device.type}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400">-</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Popular Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Item</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 w-8">#{index + 1}</span>
                      {item.image && (
                        <img 
                          src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${item.image}`}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.name_ar && (
                          <p className="text-sm text-gray-500" dir="rtl">{item.name_ar}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-medium text-gray-900">{formatNumber(item.clicks)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
        <div className="space-y-4">
          {categoryPerformance.map((category) => {
            const maxViews = Math.max(...categoryPerformance.map(c => c.views));
            const percentage = (category.views / maxViews) * 100;
            
            return (
              <div key={category.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{category.icon || '📦'}</span>
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{formatNumber(category.views)} views</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Device Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Details</h3>
        <DeviceDetailsTable dateRange={dateRange} />
      </div>
      </div>
    </div>
  );
};

// Device Details Table Component
const DeviceDetailsTable = ({ dateRange }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeviceDetails();
  }, [dateRange]);

  const fetchDeviceDetails = async () => {
    try {
      const response = await analyticsAPI.get('/api/analytics/dashboard/device-details', {
        params: { days: dateRange }
      });
      setDevices(response.data.devices || []);
    } catch (error) {
      console.error('Failed to fetch device details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No detailed device data available yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Device</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Brand</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Sessions</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device, index) => (
            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">
                <span className="font-medium text-gray-900">{device.full_name}</span>
              </td>
              <td className="py-3 px-4">
                <span className="text-gray-600">{device.brand}</span>
              </td>
              <td className="py-3 px-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${device.type === 'mobile' ? 'bg-blue-100 text-blue-800' : 
                    device.type === 'desktop' ? 'bg-green-100 text-green-800' : 
                    'bg-orange-100 text-orange-800'}`}>
                  {device.type}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <span className="font-medium text-gray-900">{device.sessions}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Analytics;