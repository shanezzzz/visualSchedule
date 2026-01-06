"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Typography, Button, Descriptions, Avatar, Space, message, Spin, Divider } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import api from "@/app/lib/axios";

const { Title } = Typography;

interface UserResponse {
  user: User;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
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
