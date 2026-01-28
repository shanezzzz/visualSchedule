"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, Typography, Button, Descriptions, Avatar, Space, message, Spin, Divider, Select } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import api from "@/app/lib/axios";

const { Title } = Typography;

interface UserResponse {
  user: User;
}

const TIMEZONE_STORAGE_KEY = "visual-schedule.timezone";
const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeZone, setTimeZone] = useState<string | null>(null);
  const router = useRouter();

  const getUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<UserResponse>("/auth/user");
      
      if (response.error) {
        console.error("API error:", response.error.message);
        return;
      }

      if (response.data?.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getUser();
  }, [getUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTimeZone = window.localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (storedTimeZone) {
      setTimeZone(storedTimeZone);
      return;
    }
    const resolvedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (resolvedTimeZone) {
      setTimeZone(resolvedTimeZone);
    }
  }, []);

  const timeZoneOptions = useMemo(() => {
    const supportedValuesOf = (
      Intl as typeof Intl & { supportedValuesOf?: (key: "timeZone") => string[] }
    ).supportedValuesOf;
    const supportedTimeZones = supportedValuesOf?.("timeZone");
    const resolvedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timeZones = new Set<string>([
      ...(supportedTimeZones?.length ? supportedTimeZones : COMMON_TIMEZONES),
      ...(resolvedTimeZone ? [resolvedTimeZone] : []),
      ...(timeZone ? [timeZone] : []),
    ]);

    return Array.from(timeZones).map((zone) => ({
      label: zone,
      value: zone,
    }));
  }, [timeZone]);

  const handleTimeZoneChange = (value: string) => {
    setTimeZone(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TIMEZONE_STORAGE_KEY, value);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await api.post("/auth/logout");

      if (response.error) {
        message.error(response.error.message);
        return;
      }

      message.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      message.error("Logout failed");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <Spin size="large" tip="Loading user profile..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card style={{ maxWidth: 800, margin: "0 auto", borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
            <div>
              <Title level={3} style={{ margin: 0 }}>Profile Information</Title>
              <Typography.Text type="secondary">Manage your profile and account settings</Typography.Text>
            </div>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <Descriptions 
            title="Basic Information" 
            bordered 
            column={{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }}
          >
            <Descriptions.Item label="Email Address">
              {user?.email || "Not linked"}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {user?.created_at ? new Date(user.created_at).toLocaleString('en-US') : "Unknown"}
            </Descriptions.Item>
            <Descriptions.Item label="Last Login">
              {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('en-US') : "Unknown"}
            </Descriptions.Item>
          </Descriptions>

          <Divider style={{ margin: '12px 0' }} />

          <Descriptions 
            title="Preferences" 
            bordered 
            column={{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }}
          >
            <Descriptions.Item label="Time Zone">
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Select
                  showSearch
                  placeholder="Select time zone"
                  optionFilterProp="label"
                  value={timeZone ?? undefined}
                  options={timeZoneOptions}
                  onChange={handleTimeZoneChange}
                  style={{ minWidth: 260 }}
                />
                <Typography.Text type="secondary">
                  Used for schedule calendar display.
                </Typography.Text>
              </Space>
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: 24, textAlign: "right" }}>
            <Button 
              danger 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
              size="large"
            >
              Logout
            </Button>
          </div>
        </Space>
      </Card>
    </div>
  );
}
