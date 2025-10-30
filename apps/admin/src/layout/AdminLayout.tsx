import React from "react";
import { Layout, LayoutProps } from "react-admin";
import { AdminAppBar } from "./components/AdminAppBar";
import { AdminMenu } from "./components/AdminMenu";
import { AdminTitle } from "./components/AdminTitle";
import { AdminDashboard } from "./components/AdminDashboard";

export const AdminLayout = (props: LayoutProps) => (
  <Layout {...props} appBar={AdminAppBar} menu={AdminMenu} />
);
