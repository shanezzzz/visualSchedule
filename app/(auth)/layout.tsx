"use client";

import { Layout } from "antd";

const { Content } = Layout;

/**
 * 认证页面布局组件
 * 用于登录和注册页面，提供简洁的居中布局
 * @param children - 子组件内容（登录/注册表单）
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* 内容区域：垂直和水平居中 */}
      <Content
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        {children}
      </Content>
    </Layout>
  );
}
