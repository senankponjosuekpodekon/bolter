import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import analyticsService, { ReportQuery, ReportResult } from '../services/analyticsService';

const REPORT_TYPES = [
  { value: 'transactions', label: 'Transactions' },
  { value: 'users', label: 'Users' },
  { value: 'kyc', label: 'KYC Documents' },
  { value: 'loans', label: 'Loans' },
  { value: 'accounts', label: 'Accounts' },
];

const AGGREGATIONS = [
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'count', label: 'Count' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index} style={{ width: '100%' }}>
    {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
  </div>
);

export const AnalyticsList: React.FC = () => {
  const [reportType, setReportType] = useState<ReportQuery['type']>('transactions');
  const [aggregation, setAggregation] = useState<ReportQuery['aggregation']>('count');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [report, setReport] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const query: ReportQuery = {
        type: reportType,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        aggregation,
      };

      const result = await analyticsService.generateReport(query);
      setReport(result);
      setTabValue(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    if (!report) return;

    try {
      setExportLoading(true);
      const blob = await analyticsService.exportReport(report, format);
      const filename = `report-${reportType}-${new Date().toISOString().split('T')[0]}.${format}`;
      analyticsService.downloadBlob(blob, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400 }}>
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Report Builder" subheader="Configure and generate custom analytics reports" />
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportQuery['type'])}
                label="Report Type"
              >
                {REPORT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Aggregation</InputLabel>
              <Select
                value={aggregation || 'count'}
                onChange={(e) => setAggregation(e.target.value as ReportQuery['aggregation'])}
                label="Aggregation"
              >
                {AGGREGATIONS.map((agg) => (
                  <MenuItem key={agg.value} value={agg.value}>
                    {agg.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerateReport}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Generate Report'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {report && (
        <Card>
          <CardHeader
            title="Report Results"
            subheader={`${report.summary.totalRecords} records • ${report.summary.segments} segments`}
          />
          <CardContent>
            <Paper sx={{ width: '100%' }}>
              <Tabs value={tabValue} onChange={(e: React.SyntheticEvent, v: number) => setTabValue(v)}>
                <Tab label="Chart" />
                <Tab label="Data" />
                <Tab label="Export" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Box sx={{ height: 400, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    {aggregation === 'count' ? (
                      <BarChart data={report.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="segment" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    ) : (
                      <LineChart data={report.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke="#8884d8" />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Segment</TableCell>
                        <TableCell align="right">Value</TableCell>
                        {report.data[0]?.trend !== undefined && (
                          <TableCell align="right">Trend</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.data.map((row, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>{new Date(row.timestamp).toLocaleDateString()}</TableCell>
                          <TableCell>{row.segment}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {row.value.toFixed(2)}
                          </TableCell>
                          {row.trend !== undefined && (
                            <TableCell
                              align="right"
                              sx={{ color: row.trend >= 0 ? 'green' : 'red' }}
                            >
                              {row.trend >= 0 ? '↑' : '↓'} {Math.abs(row.trend).toFixed(1)}%
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography color="textSecondary">
                    Export this report to analyze further in your preferred tool.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={() => handleExport('csv')}
                      disabled={exportLoading}
                    >
                      📥 Export CSV
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => handleExport('json')}
                      disabled={exportLoading}
                    >
                      📥 Export JSON
                    </Button>
                  </Box>
                </Box>
              </TabPanel>
            </Paper>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AnalyticsList;

