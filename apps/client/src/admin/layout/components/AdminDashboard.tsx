import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Box,
  LinearProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useGetList } from "react-admin";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const StatCard = ({
  title,
  value,
  icon,
  trend,
  trendValue,
  color = "#1976d2",
  subtitle,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: number;
  color?: string;
  subtitle?: string;
}) => (
  <Card
    sx={{
      height: "100%",
      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      borderLeft: `4px solid ${color}`,
      transition: "transform 0.2s, box-shadow 0.2s",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
      },
    }}
  >
    <CardHeader
      avatar={icon}
      title={<Typography variant="subtitle2">{title}</Typography>}
      sx={{ pb: 1 }}
    />
    <CardContent sx={{ pt: 0 }}>
      <Typography variant="h5" sx={{ fontWeight: "bold", color }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {subtitle}
        </Typography>
      )}
      {trend && trendValue !== undefined && (
        <Box sx={{ display: "flex", alignItems: "center", mt: 1, gap: 0.5 }}>
          {trend === "up" ? (
            <TrendingUpIcon sx={{ fontSize: 16, color: "#4caf50" }} />
          ) : trend === "down" ? (
            <TrendingDownIcon sx={{ fontSize: 16, color: "#f44336" }} />
          ) : null}
          <Typography
            variant="caption"
            sx={{
              color:
                trend === "up"
                  ? "#4caf50"
                  : trend === "down"
                    ? "#f44336"
                    : "text.secondary",
            }}
          >
            {trend === "up" ? "+" : ""}
            {trendValue}%
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

export const AdminDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { data: users = [] } = useGetList("users");
  const { data: transactions = [] } = useGetList("transactions");
  const { data: kyc = [] } = useGetList("kyc_documents");

  // Calculate statistics
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(
      (u: { is_active?: boolean }) => u.is_active !== false
    ).length;
    const pendingKyc = kyc.filter(
      (d: { status?: string }) => d.status === "PENDING"
    ).length;
    const approvedKyc = kyc.filter(
      (d: { status?: string }) => d.status === "APPROVED"
    ).length;
    const rejectedKyc = kyc.filter(
      (d: { status?: string }) => d.status === "REJECTED"
    ).length;
    const kycApprovalRate =
      kyc.length > 0
        ? Math.round((approvedKyc / (approvedKyc + rejectedKyc)) * 100) || 0
        : 0;

    const pendingTransactions = transactions.filter(
      (t: { status?: string }) => t.status === "PENDING"
    ).length;
    const completedTransactions = transactions.filter(
      (t: { status?: string }) => t.status === "COMPLETED"
    ).length;
    const failedTransactions = transactions.filter(
      (t: { status?: string }) => t.status === "FAILED"
    ).length;
    const transactionSuccessRate =
      transactions.length > 0
        ? Math.round((completedTransactions / transactions.length) * 100) || 0
        : 0;

    // Calculate average transaction volume (24h, 7d, 30d)
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const vol24h = transactions.filter(
      (t: { created_at?: string }) => new Date(t.created_at || 0) > last24h
    ).length;
    const vol7d = transactions.filter(
      (t: { created_at?: string }) => new Date(t.created_at || 0) > last7d
    ).length;
    const vol30d = transactions.filter(
      (t: { created_at?: string }) => new Date(t.created_at || 0) > last30d
    ).length;

    // Estimate fraud risk (simplified)
    const overduePendingKyc = kyc.filter(
      (d: { status?: string; created_at?: string }) => {
        if (d.status !== "PENDING") return false;
        const createdAt = new Date(d.created_at || 0);
        const hoursOld =
          (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return hoursOld > 48;
      }
    ).length;

    const riskScore = Math.min(
      100,
      Math.round(
        (failedTransactions * 10 + overduePendingKyc * 5) /
          (transactions.length || 1)
      )
    );

    return {
      totalUsers,
      activeUsers,
      userGrowth: 12, // placeholder
      pendingKyc,
      approvedKyc,
      rejectedKyc,
      kycApprovalRate,
      pendingTransactions,
      completedTransactions,
      failedTransactions,
      transactionSuccessRate,
      vol24h,
      vol7d,
      vol30d,
      overduePendingKyc,
      riskScore,
    };
  }, [users, transactions, kyc]);

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 0.5 }}>
          Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Real-time overview of your platform
        </Typography>
      </Box>

      {/* Key Metrics Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            color="#2196f3"
            subtitle={`${stats.activeUsers} active`}
            trend="up"
            trendValue={stats.userGrowth}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Transaction Success"
            value={`${stats.transactionSuccessRate}%`}
            color="#4caf50"
            subtitle={`${stats.completedTransactions}/${stats.pendingTransactions + stats.completedTransactions + stats.failedTransactions}`}
            trend={stats.transactionSuccessRate >= 95 ? "up" : "down"}
            trendValue={
              stats.transactionSuccessRate >= 95
                ? stats.transactionSuccessRate - 90
                : 90 - stats.transactionSuccessRate
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="KYC Approval Rate"
            value={`${stats.kycApprovalRate}%`}
            color="#9c27b0"
            subtitle={`${stats.approvedKyc}/${stats.approvedKyc + stats.rejectedKyc}`}
            trend={stats.kycApprovalRate >= 85 ? "up" : "neutral"}
            trendValue={Math.abs(stats.kycApprovalRate - 85)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Risk Score"
            value={stats.riskScore}
            color={stats.riskScore > 50 ? "#f44336" : "#ff9800"}
            subtitle={stats.riskScore > 50 ? "⚠️ High risk" : "🟡 Moderate"}
            icon={
              stats.riskScore > 50 ? (
                <WarningIcon sx={{ color: "#f44336" }} />
              ) : (
                <CheckCircleIcon sx={{ color: "#ff9800" }} />
              )
            }
          />
        </Grid>
      </Grid>

      {/* Transaction & KYC Status */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardHeader
              title={<Typography variant="h6">Transaction Status</Typography>}
              sx={{ pb: 2 }}
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Completed</Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {stats.completedTransactions}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={
                    stats.completedTransactions > 0
                      ? (stats.completedTransactions /
                          (stats.completedTransactions +
                            stats.pendingTransactions +
                            stats.failedTransactions)) *
                        100
                      : 0
                  }
                  sx={{ mb: 2, backgroundColor: "#e0e0e0" }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Pending</Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {stats.pendingTransactions}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={
                    stats.pendingTransactions > 0
                      ? (stats.pendingTransactions /
                          (stats.completedTransactions +
                            stats.pendingTransactions +
                            stats.failedTransactions)) *
                        100
                      : 0
                  }
                  sx={{ mb: 2, backgroundColor: "#e0e0e0" }}
                />
              </Box>
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Failed</Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {stats.failedTransactions}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={
                    stats.failedTransactions > 0
                      ? (stats.failedTransactions /
                          (stats.completedTransactions +
                            stats.pendingTransactions +
                            stats.failedTransactions)) *
                        100
                      : 0
                  }
                  sx={{ mb: 2, backgroundColor: "#e0e0e0" }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardHeader
              title={<Typography variant="h6">KYC Document Status</Typography>}
              sx={{ pb: 2 }}
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Approved</Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {stats.approvedKyc}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={
                    stats.approvedKyc > 0
                      ? (stats.approvedKyc /
                          (stats.approvedKyc +
                            stats.pendingKyc +
                            stats.rejectedKyc)) *
                        100
                      : 0
                  }
                  sx={{ mb: 2, backgroundColor: "#e0e0e0" }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Pending</Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {stats.pendingKyc}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={
                    stats.pendingKyc > 0
                      ? (stats.pendingKyc /
                          (stats.approvedKyc +
                            stats.pendingKyc +
                            stats.rejectedKyc)) *
                        100
                      : 0
                  }
                  sx={{ mb: 2, backgroundColor: "#e0e0e0" }}
                />
              </Box>
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Rejected</Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {stats.rejectedKyc}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={
                    stats.rejectedKyc > 0
                      ? (stats.rejectedKyc /
                          (stats.approvedKyc +
                            stats.pendingKyc +
                            stats.rejectedKyc)) *
                        100
                      : 0
                  }
                  sx={{ mb: 2, backgroundColor: "#e0e0e0" }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Transaction Volume & Alerts */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title={<Typography variant="h6">Transaction Volume</Typography>}
              sx={{ pb: 2 }}
            />
            <CardContent>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    textAlign: "center",
                    p: 2,
                    backgroundColor: "#f5f5f5",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Last 24h
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: "bold", color: "#2196f3" }}
                  >
                    {stats.vol24h}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    textAlign: "center",
                    p: 2,
                    backgroundColor: "#f5f5f5",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Last 7d
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: "bold", color: "#9c27b0" }}
                  >
                    {stats.vol7d}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    textAlign: "center",
                    p: 2,
                    backgroundColor: "#f5f5f5",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Last 30d
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: "bold", color: "#4caf50" }}
                  >
                    {stats.vol30d}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              backgroundColor:
                stats.overduePendingKyc > 0 ? "#fff3e0" : "#f1f8e9",
            }}
          >
            <CardHeader
              title={<Typography variant="h6">Alerts & Actions</Typography>}
              sx={{ pb: 2 }}
            />
            <CardContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {stats.overduePendingKyc > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: 1.5,
                      backgroundColor: "rgba(244, 67, 54, 0.1)",
                      borderRadius: 1,
                      borderLeft: "3px solid #f44336",
                    }}
                  >
                    <WarningIcon sx={{ color: "#f44336", fontSize: 20 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {stats.overduePendingKyc} KYC overdue
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        Pending for more than 48 hours
                      </Typography>
                    </Box>
                  </Box>
                )}
                {stats.riskScore > 50 && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: 1.5,
                      backgroundColor: "rgba(255, 152, 0, 0.1)",
                      borderRadius: 1,
                      borderLeft: "3px solid #ff9800",
                    }}
                  >
                    <WarningIcon sx={{ color: "#ff9800", fontSize: 20 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        High fraud risk
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        Risk score: {stats.riskScore}%
                      </Typography>
                    </Box>
                  </Box>
                )}
                {stats.pendingTransactions > 10 && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: 1.5,
                      backgroundColor: "rgba(33, 150, 243, 0.1)",
                      borderRadius: 1,
                      borderLeft: "3px solid #2196f3",
                    }}
                  >
                    <CheckCircleIcon sx={{ color: "#2196f3", fontSize: 20 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Review pending transactions
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {stats.pendingTransactions} transactions awaiting action
                      </Typography>
                    </Box>
                  </Box>
                )}
                {stats.overduePendingKyc === 0 &&
                  stats.riskScore <= 50 &&
                  stats.pendingTransactions <= 10 && (
                    <Typography variant="body2" sx={{ color: "#4caf50" }}>
                      ✅ All systems normal
                    </Typography>
                  )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
