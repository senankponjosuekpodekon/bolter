import React from "react";
import { Layout, LayoutProps } from "react-admin";
import { AdminAppBar } from "./components/AdminAppBar";
import { AdminMenu } from "./components/AdminMenu";
import { NotificationsProvider } from "./components/NotificationsProvider";

export const AdminLayout = (props: LayoutProps) => (
  <NotificationsProvider>
    <Layout {...props} appBar={AdminAppBar} menu={AdminMenu} />
  </NotificationsProvider>
);
