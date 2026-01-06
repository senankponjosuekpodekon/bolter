import React, { useState, useEffect } from 'react';
import {
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
} from 'recharts';
import { Activity, Zap, AlertCircle, TrendingUp, Cpu, HardDrive } from 'lucide-react';

interface PerformanceMetric {
  timestamp: string;
  avgResponseTime: number;
  errorRate: number;
  requests: number;
}

interface SystemMetric {
  timestamp: string;
  heapUsed: number;
  heapTotal: number;
  cpuUser: number;
  cpuSystem: number;
}

interface Alert {
  id: string;
  type: 'slow_endpoint' | 'high_error_rate' | 'high_memory_usage';
  severity: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

export default function AdminPerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);

  // Generate mock metrics
  useEffect(() => {
    const mockMetrics = generateMockMetrics(timeRange);
    const mockSystemMetrics = generateMockSystemMetrics(timeRange);
    const mockAlerts = generateMockAlerts();

    setMetrics(mockMetrics);
    setSystemMetrics(mockSystemMetrics);
    setAlerts(mockAlerts);
  }, [timeRange]);

  // Calculate summary stats
  const summaryStats = {
    avgResponseTime: metrics.length > 0 ? Math.round(metrics.reduce((a, m) => a + m.avgResponseTime, 0) / metrics.length) : 0,
    avgErrorRate: metrics.length > 0 ? (metrics.reduce((a, m) => a + m.errorRate, 0) / metrics.length).toFixed(2) : '0',
    totalRequests: metrics.reduce((a, m) => a + m.requests, 0),
    slowestEndpoint: {
      name: '/api/reports/export',
      time: 5234,
    },
    cacheHitRate: (Math.random() * 100).toFixed(1),
    memoryUsage: systemMetrics.length > 0 ? systemMetrics[systemMetrics.length - 1].heapUsed : 0,
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
            <p className="text-gray-600">Real-time system and API performance metrics</p>
          </div>
          <div className="flex gap-2">
            {(['1h', '24h', '7d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {range === '1h' ? '1 Hour' : range === '24h' ? '24 Hours' : '7 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
              <p className="text-3xl font-bold text-gray-900">{summaryStats.avgResponseTime}ms</p>
              <p className="text-xs text-gray-500 mt-2">Target: &lt;500ms</p>
            </div>
            <Zap className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Error Rate</p>
              <p className="text-3xl font-bold text-gray-900">{summaryStats.avgErrorRate}%</p>
              <p className="text-xs text-gray-500 mt-2">Target: &lt;1%</p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900">{(summaryStats.totalRequests / 1000).toFixed(1)}K</p>
              <p className="text-xs text-gray-500 mt-2">Last {timeRange}</p>
            </div>
            <Activity className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Response Time Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics}>
              <defs>
                <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `${value}ms`} />
              <Area type="monotone" dataKey="avgResponseTime" stroke="#8884d8" fillOpacity={1} fill="url(#colorResponse)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Error Rate Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Error Rate Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics}>
              <defs>
                <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff7c7c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff7c7c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Area type="monotone" dataKey="errorRate" stroke="#ff7c7c" fillOpacity={1} fill="url(#colorError)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory Usage */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Memory Usage</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={systemMetrics}>
              <defs>
                <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis label={{ value: 'MB', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `${value}MB`} />
              <Area type="monotone" dataKey="heapUsed" stroke="#82ca9d" fillOpacity={1} fill="url(#colorMemory)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* CPU Usage */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">CPU Usage</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={systemMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="cpuUser" stackId="cpu" fill="#ffa500" name="User" />
              <Bar dataKey="cpuSystem" stackId="cpu" fill="#ff7300" name="System" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Endpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Slowest Endpoints</h2>
          <div className="space-y-3">
            {[
              { endpoint: '/api/reports/export', time: 5234 },
              { endpoint: '/api/analytics/query', time: 3456 },
              { endpoint: '/api/transactions/list', time: 2123 },
              { endpoint: '/api/webhooks/test', time: 1890 },
              { endpoint: '/api/users/search', time: 1234 },
            ].map((item) => (
              <div
                key={item.endpoint}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <span className="font-mono text-sm text-gray-700">{item.endpoint}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${Math.min((item.time / 5000) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-12 text-right">{item.time}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Endpoint Stats</h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 font-medium">Cache Hit Rate</p>
              <div className="mt-2 flex items-center justify-between">
                <div className="h-2 flex-1 bg-green-200 rounded-full overflow-hidden mr-3">
                  <div className="h-full bg-green-500" style={{ width: `${summaryStats.cacheHitRate}%` }} />
                </div>
                <p className="text-lg font-bold text-green-900">{summaryStats.cacheHitRate}%</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 font-medium">Memory Usage</p>
              <div className="mt-2 flex items-center justify-between">
                <div className="h-2 flex-1 bg-blue-200 rounded-full overflow-hidden mr-3">
                  <div className="h-full bg-blue-500" style={{ width: `${Math.min((summaryStats.memoryUsage / 1024) * 100, 100)}%` }} />
                </div>
                <p className="text-lg font-bold text-blue-900">{(summaryStats.memoryUsage / 1024).toFixed(1)}GB</p>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-700 font-medium">Uptime</p>
              <p className="text-lg font-bold text-purple-900 mt-2">98.5%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Performance Alerts</h2>
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === 'error'
                    ? 'bg-red-50 border-red-500 text-red-900'
                    : alert.severity === 'warning'
                      ? 'bg-yellow-50 border-yellow-500 text-yellow-900'
                      : 'bg-blue-50 border-blue-500 text-blue-900'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{alert.message}</p>
                    <p className="text-sm opacity-75">Type: {alert.type}</p>
                  </div>
                  <p className="text-xs opacity-75">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Mock data generators
function generateMockMetrics(timeRange: string): PerformanceMetric[] {
  const metrics: PerformanceMetric[] = [];
  const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : 7 * 24;
  const now = new Date();

  for (let i = hours - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000).toLocaleTimeString();
    metrics.push({
      timestamp,
      avgResponseTime: 200 + Math.random() * 300,
      errorRate: Math.random() * 5,
      requests: Math.floor(1000 + Math.random() * 3000),
    });
  }

  return metrics;
}

function generateMockSystemMetrics(timeRange: string): SystemMetric[] {
  const metrics: SystemMetric[] = [];
  const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : 7 * 24;
  const now = new Date();

  for (let i = hours - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000).toLocaleTimeString();
    metrics.push({
      timestamp,
      heapUsed: 256 + Math.random() * 512,
      heapTotal: 1024,
      cpuUser: 20 + Math.random() * 30,
      cpuSystem: 5 + Math.random() * 15,
    });
  }

  return metrics;
}

function generateMockAlerts(): Alert[] {
  return [
    {
      id: '1',
      type: 'slow_endpoint',
      severity: 'warning',
      message: '/api/reports/export is slow (avg 5234ms)',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'high_error_rate',
      severity: 'error',
      message: '/api/webhooks/test has high error rate (2.3%)',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    },
  ];
}
