"use client";

import { Layout } from "antd";

import Sidebar from "@/components/Sidebar";

const { Content } = Layout;

/**
 * 仪表板布局组件
 * 用于所有需要登录后访问的页面，包含侧边栏导航
 * @param children - 子组件内容（日程、员工、个人资料页面）
 */
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Layout hasSider>
      {/* 左侧导航栏 */}
      <Sidebar />
      {/* 主内容区域 */}
      <Layout className="h-screen">
        <Content className="h-full overflow-auto p-6">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
