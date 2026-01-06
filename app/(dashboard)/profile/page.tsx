"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Typography, Button, Descriptions, Avatar, Space, message, Spin, Divider } from "antd";
import { UserOutlined, LogoutOutlined, MailOutlined } from "@ant-design/icons";
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
      const response = await api.get<UserResponse>("/auth/user");
      
      if (response.error) {
        // Axios interceptor will handle 401, for other errors we just log
        console.error("API error:", response.error.message);
        return;
      }

      if (response.data?.user) {
        const userData = response.data.user;
        setUser(userData);
        // 只存需要展示的基础信息到 localStorage
        const displayInfo = {
          email: userData.email,
          created_at: userData.created_at,
          last_sign_in_at: userData.last_sign_in_at,
        };
        localStorage.setItem("user_info", JSON.stringify(displayInfo));
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Try to load from localStorage first for faster UX
    const localUser = localStorage.getItem("user_info");
    if (localUser) {
      try {
        const parsedUser = JSON.parse(localUser);
        setUser(parsedUser);
        setLoading(false); // We have something to show, stop showing the full page loader
      } catch (e) {
        console.error("Error parsing local user info:", e);
      }
    }

    // 2. Fetch fresh data from API
    getUser();
  }, [getUser]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("user_info");
      message.success("已成功退出登录");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      message.error("退出登录失败");
    }
  };

  if (loading && !user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <Spin size="large" tip="加载用户信息中..." />
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
              <Title level={3} style={{ margin: 0 }}>个人信息</Title>
              <Typography.Text type="secondary">管理您的个人资料和账号设置</Typography.Text>
            </div>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <Descriptions 
            title="基础信息" 
            bordered 
            column={{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }}
          >
            <Descriptions.Item label={<Space><MailOutlined /> 邮箱地址</Space>}>
              {user?.email || "未绑定"}
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {user?.created_at ? new Date(user.created_at).toLocaleString('zh-CN') : "未知"}
            </Descriptions.Item>
            <Descriptions.Item label="最后登录">
              {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('zh-CN') : "未知"}
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: 24, textAlign: "right" }}>
            <Button 
              danger 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
              size="large"
            >
              退出登录
            </Button>
          </div>
        </Space>
      </Card>
    </div>
  );
}
