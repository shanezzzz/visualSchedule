"use client";

import { Layout, Menu, Typography } from "antd";
import type { MenuProps } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNavItems } from "@/lib/navigation";

const { Sider } = Layout;

const menuItems: MenuProps["items"] = dashboardNavItems.map((item) => ({
  key: item.href,
  label: <Link href={item.href}>{item.label}</Link>,
}));

export default function Sidebar() {
  const pathname = usePathname();
  const selectedKey = dashboardNavItems.find((item) =>
    pathname === item.href || pathname?.startsWith(`${item.href}/`)
  )?.href;

  return (
    <Sider
      breakpoint="lg"
      collapsedWidth="0"
      theme="light"
      width={240}
      style={{ borderRight: "1px solid #f0f0f0" }}
    >
      <div style={{ padding: "20px 16px 12px" }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          Visual Schedule
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Visual Schedule Management
        </Typography.Text>
      </div>
      <Menu
        mode="inline"
        items={menuItems}
        selectedKeys={selectedKey ? [selectedKey] : []}
      />
    </Sider>
  );
}
