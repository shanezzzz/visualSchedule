import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App as AntdApp } from "antd";
import { MessageProvider } from "./components/MessageProvider";
import "antd/dist/reset.css";
import "./globals.css";

// 配置 Google 字体 - Geist Sans（无衬线字体）
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// 配置 Google 字体 - Geist Mono（等宽字体，用于代码显示）
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 网站元数据配置
export const metadata: Metadata = {
  title: "Visual Schedule",
  description: "Visual Schedule Management System",
};

/**
 * 根布局组件
 * 这是整个应用的最外层布局，所有页面都会包裹在这个组件中
 * @param children - 子组件内容
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Ant Design 组件注册器，用于服务端渲染样式 */}
        <AntdRegistry>
          <AntdApp>
            <MessageProvider>{children}</MessageProvider>
          </AntdApp>
        </AntdRegistry>
      </body>
    </html>
  );
}
