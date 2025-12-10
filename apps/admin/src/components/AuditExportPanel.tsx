import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DownloadIcon from "@mui/icons-material/Download";
import { useNotify } from "react-admin";

interface AuditExportFilter {
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
}

export const AuditExportPanel: React.FC = () => {
  const notify = useNotify();
  const [filters, setFilters] = useState<AuditExportFilter>({});
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const handleFilterChange = (key: keyof AuditExportFilter, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const handleExport = async (format: "csv" | "json" | "pdf") => {
    setExporting(true);
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const endpoint = `/api/admin/audit-export/${format}?${queryParams.toString()}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get the file extension based on format
      const ext = format === "pdf" ? "html" : format;
      const filename = `audit-logs-${new Date().toISOString().split("T")[0]}.${ext}`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      notify(`Export successful: ${filename}`, { type: "success" });
    } catch (error) {
      notify(
        `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        { type: "error" }
      );
    } finally {
      setExporting(false);
    }
  };

  const handleLoadStats = async () => {
    setStatsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(
        `/api/admin/audit-export/stats?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load statistics");
      }

      const data = await response.json();
      setStats(data);
      notify("Statistics loaded", { type: "success" });
    } catch (error) {
      notify(
        `Error loading stats: ${error instanceof Error ? error.message : "Unknown error"}`,
        { type: "error" }
      );
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        📊 Audit Log Export
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Filters" />
        <CardContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              label="Date From"
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Date To"
              type="date"
              value={filters.dateTo || ""}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="User ID"
              value={filters.userId || ""}
              onChange={(e) => handleFilterChange("userId", e.target.value)}
              placeholder="Filter by user ID"
            />
            <TextField
              label="Action"
              value={filters.action || ""}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              placeholder="e.g., kyc_approved, transaction_rejected"
            />
            <TextField
              label="Resource Type"
              value={filters.resourceType || ""}
              onChange={(e) =>
                handleFilterChange("resourceType", e.target.value)
              }
              placeholder="e.g., kyc_documents, transactions"
            />
            <TextField
              label="Resource ID"
              value={filters.resourceId || ""}
              onChange={(e) => handleFilterChange("resourceId", e.target.value)}
              placeholder="Filter by specific resource ID"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Export Options" />
        <CardContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Choose your preferred format for exporting audit logs. The export
            will include all logs matching the above filters.
          </Alert>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport("csv")}
              disabled={exporting}
              sx={{ flex: 1 }}
            >
              {exporting ? <CircularProgress size={20} /> : "Export as CSV"}
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport("json")}
              disabled={exporting}
              sx={{ flex: 1 }}
            >
              {exporting ? <CircularProgress size={20} /> : "Export as JSON"}
            </Button>
            <Button
              variant="contained"
              color="warning"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport("pdf")}
              disabled={exporting}
              sx={{ flex: 1 }}
            >
              {exporting ? <CircularProgress size={20} /> : "Export as HTML"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">📈 Statistics</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ width: "100%" }}>
            <Button
              variant="outlined"
              onClick={handleLoadStats}
              disabled={statsLoading}
              sx={{ mb: 2 }}
            >
              {statsLoading ? (
                <CircularProgress size={20} />
              ) : (
                "Load Statistics"
              )}
            </Button>

            {stats && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Actions
                    </Typography>
                    <Typography variant="h5">{stats.totalActions}</Typography>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Date Range
                    </Typography>
                    <Typography variant="body2">
                      {stats.dateRange.earliest
                        ? new Date(
                            stats.dateRange.earliest
                          ).toLocaleDateString()
                        : "N/A"}{" "}
                      to{" "}
                      {stats.dateRange.latest
                        ? new Date(stats.dateRange.latest).toLocaleDateString()
                        : "N/A"}
                    </Typography>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Top Actions
                    </Typography>
                    <Box sx={{ fontSize: 12, lineHeight: 1.8 }}>
                      {Object.entries(stats.actionBreakdown)
                        .sort((a, b) => (b[1] as number) - (a[1] as number))
                        .slice(0, 5)
                        .map(([action, count]: [string, unknown]) => (
                          <div key={action}>
                            {action}: <strong>{count as number}</strong>
                          </div>
                        ))}
                    </Box>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Resource Types
                    </Typography>
                    <Box sx={{ fontSize: 12, lineHeight: 1.8 }}>
                      {Object.entries(stats.resourceTypeBreakdown)
                        .sort((a, b) => (b[1] as number) - (a[1] as number))
                        .map(([type, count]: [string, unknown]) => (
                          <div key={type}>
                            {type}: <strong>{count as number}</strong>
                          </div>
                        ))}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
