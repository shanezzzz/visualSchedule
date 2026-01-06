"use client";

import { useState } from "react";
import { Card, Tabs, Form, Input, Button, message, Typography } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/app/lib/axios";

const { Title, Text } = Typography;

interface AuthResponse {
  user: {
    id: string;
    email?: string;
  } | null;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login");

  const onFinish = async (values: Record<string, string>) => {
    setLoading(true);
    try {
      const endpoint = activeTab === "login" ? "/auth/login" : "/auth/register";
      const response = await api.post<AuthResponse>(endpoint, values);

      if (response.error) {
        message.error(response.error.message);
        return;
      }

      message.success(activeTab === "login" ? "登录成功！" : "注册成功！请检查邮箱确认。");
      
      if (activeTab === "login") {
        router.push("/schedule");
      } else {
        setActiveTab("login");
      }
    } catch (error: unknown) {
      console.error("Auth error:", error);
      message.error("登录失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ width: "100%", maxWidth: 400, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 8 }}>
          {activeTab === "login" ? "欢迎回来" : "创建账号"}
        </Title>
        <Text type="secondary">
          {activeTab === "login" ? "请输入您的凭据以访问您的日程" : "开始管理您的视觉日程"}
        </Text>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        centered
        items={[
          { key: "login", label: "登录" },
          { key: "register", label: "注册" },
        ]}
      />

      <Form
        name="auth_form"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: "请输入邮箱地址！" },
            { type: "email", message: "请输入有效的邮箱地址！" },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="邮箱" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: "请输入密码！" },
            { min: 6, message: "密码至少需要6位！" },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="密码" />
        </Form.Item>

        {activeTab === "register" && (
          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "请确认密码！" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("两次输入的密码不一致！"));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>
        )}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{ marginTop: 8 }}
          >
            {activeTab === "login" ? "登录" : "立即注册"}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
