import React from "react";
import { Layout, LayoutProps } from "react-admin";
import { AdminAppBar } from "./components/AdminAppBar";
import { AdminMenu } from "./components/AdminMenu";
import { NotificationsProvider } from "./components/NotificationsProvider";
import { Notifications } from "../components/Notifications";
import AdminErrorBoundary from "../components/AdminErrorBoundary";

export const AdminLayout = (props: LayoutProps) => (
  <NotificationsProvider>
    <AdminErrorBoundary>
      <>
        <Notifications />
        <Layout {...props} appBar={AdminAppBar} menu={AdminMenu} />
      </>
    </AdminErrorBoundary>
  </NotificationsProvider>
);
