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
      message.success("已成功退出登录");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      message.error("退出登录失败");
    }
  };

  if (loading) {
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
