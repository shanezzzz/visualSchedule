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
    <Layout hasSider>
      <Sidebar />
      <Layout className="h-screen">
        <Content className="h-full overflow-auto p-6">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
