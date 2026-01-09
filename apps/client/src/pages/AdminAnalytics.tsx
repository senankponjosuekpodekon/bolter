import { useState, useMemo } from 'react';
import {
  LineChart,
  BarChart,
  PieChart,
  Line,
  Bar,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Download, RefreshCw, Filter } from 'lucide-react';

interface ReportData {
  id: string;
  name: string;
  type: string;
  generatedAt: string;
  data: Array<{ timestamp: string; segment: string; value: number }>;
  summary: {
    totalRecords: number;
    startDate: string;
    endDate: string;
    segments: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AnalyticsDashboard() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState('transactions');
  const [loading, setLoading] = useState(false);

  // Aggregate data by segment
  const aggregatedData = useMemo(() => {
    if (!selectedReport) return [];

    const grouped: Record<string, { timestamp: string; value: number; count: number }> = {};

    selectedReport.data.forEach((item) => {
      const key = item.segment;
      if (!grouped[key]) {
        grouped[key] = { timestamp: item.timestamp, value: 0, count: 0 };
      }
      grouped[key].value += item.value;
      grouped[key].count += 1;
    });

    return Object.values(grouped).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [selectedReport]);

  // Generate mock report
  const generateReport = async () => {
    setLoading(true);
    try {
      // Simulate API call
      const mockData = generateMockReportData(reportType, startDate, endDate);
      setSelectedReport(mockData);
      setReports([...reports, mockData]);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  // Render appropriate chart
  const renderChart = () => {
    if (!aggregatedData || aggregatedData.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">No data to display. Generate a report first.</p>
        </div>
      );
    }

    const chartProps = {
      width: 100,
      height: 400,
      data: aggregatedData,
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer {...chartProps}>
            <LineChart data={aggregatedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" name="Value" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer {...chartProps}>
            <BarChart data={aggregatedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name="Value" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer {...chartProps}>
            <PieChart>
              <Pie
                data={aggregatedData.slice(0, 6)}
                dataKey="value"
                nameKey="timestamp"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {aggregatedData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  // Export report
  const exportReport = (format: 'csv' | 'json') => {
    if (!selectedReport) return;

    let content = '';
    let filename = '';

    if (format === 'csv') {
      content = convertToCSV(selectedReport.data);
      filename = `report-${selectedReport.id}.csv`;
    } else {
      content = JSON.stringify(selectedReport, null, 2);
      filename = `report-${selectedReport.id}.json`;
    }

    downloadFile(content, filename, format);
  };

  const convertToCSV = (data: Record<string, unknown>[]) => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = [headers.join(',')];

    data.forEach((row) => {
      const values = headers.map((header) => {
        const rawValue = row[header];
        const normalized = typeof rawValue === 'string' || typeof rawValue === 'number'
          ? String(rawValue)
          : '';
        return normalized.includes(',') ? `"${normalized}"` : normalized;
      });
      rows.push(values.join(','));
    });

    return rows.join('\n');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const mimeType = type === 'csv' ? 'text/csv' : 'application/json';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Generate and analyze custom reports</p>
      </div>

      {/* Report Builder */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Report Builder</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="transactions">Transactions</option>
              <option value="users">Users</option>
              <option value="kyc">KYC Applications</option>
              <option value="loans">Loans</option>
              <option value="accounts">Accounts</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {/* Chart Display */}
      {selectedReport && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Report Visualization</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  chartType === 'line'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Line
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  chartType === 'bar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Bar
              </button>
              <button
                onClick={() => setChartType('pie')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  chartType === 'pie'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Pie
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-white">{renderChart()}</div>

          {/* Report Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 font-medium">Total Records</p>
              <p className="text-2xl font-bold text-blue-900">{selectedReport.summary.totalRecords}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 font-medium">Segments</p>
              <p className="text-2xl font-bold text-green-900">{selectedReport.summary.segments}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-700 font-medium">Report Type</p>
              <p className="text-2xl font-bold text-purple-900 capitalize">{selectedReport.type}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-700 font-medium">Generated</p>
              <p className="text-sm font-bold text-orange-900">{new Date(selectedReport.generatedAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Export Options */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => exportReport('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => exportReport('json')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
          </div>
        </div>
      )}

      {/* Recent Reports */}
      {reports.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Reports</h2>
          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedReport?.id === report.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{report.name}</p>
                    <p className="text-sm text-gray-600">
                      {report.summary.totalRecords} records • {report.summary.segments} segments
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">{new Date(report.generatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Mock data generator
function generateMockReportData(type: string, startDate: string, endDate: string): ReportData {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const data: Array<{ timestamp: string; segment: string; value: number }> = [];

  const segments =
    type === 'transactions'
      ? ['approved', 'pending', 'rejected']
      : type === 'users'
        ? ['active', 'inactive', 'pending']
        : type === 'kyc'
          ? ['approved', 'pending', 'rejected']
          : type === 'loans'
            ? ['disbursed', 'pending', 'rejected']
            : ['checking', 'savings', 'investment'];

  const current = new Date(start);
  while (current < end) {
    segments.forEach((segment) => {
      data.push({
        timestamp: current.toISOString().split('T')[0],
        segment,
        value: Math.floor(Math.random() * 10000) + 1000,
      });
    });
    current.setDate(current.getDate() + 1);
  }

  return {
    id: `rpt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    name: `${type} Report - ${startDate} to ${endDate}`,
    type,
    generatedAt: new Date().toISOString(),
    data,
    summary: {
      totalRecords: data.length,
      startDate,
      endDate,
      segments: segments.length,
    },
  };
}
