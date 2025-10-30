import React from "react";
import { Card, CardContent, CardHeader, Typography } from "@mui/material";
import { useGetList } from "react-admin";

export const AdminDashboard = () => {
  const { data: users } = useGetList("users");
  const { data: transactions } = useGetList("transactions", {
    filter: { status: "PENDING" },
  });
  const { data: kyc } = useGetList("kyc_documents", {
    filter: { status: "PENDING" },
  });

  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome to the Admin Panel</h1>
      <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
        <Card>
          <CardHeader
            title={<Typography variant="h6">Total Users</Typography>}
          />
          <CardContent>{users?.length || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader
            title={<Typography variant="h6">Pending Transactions</Typography>}
          />
          <CardContent>{transactions?.length || 0}</CardContent>
        </Card>
        <Card>
          <CardHeader
            title={<Typography variant="h6">Pending KYC</Typography>}
          />
          <CardContent>{kyc?.length || 0}</CardContent>
        </Card>
      </div>
    </div>
  );
};
