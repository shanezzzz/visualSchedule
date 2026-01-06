"use client";

import { Layout } from "antd";

import Sidebar from "@/components/Sidebar";

const { Content } = Layout;

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout hasSider>
        <Sidebar />
        <Content style={{ padding: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
