"use client";

import { useState } from "react";
import { Card, Tabs, Form, Input, Button, message, Typography } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/app/lib/axios";

const { Title, Text } = Typography;

// 认证响应的数据类型
interface AuthResponse {
  user: {
    id: string;
    email?: string;
  } | null;
}

/**
 * 登录/注册页面组件
 * 支持用户登录和注册功能，使用标签页切换
 */
export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login"); // 当前激活的标签页：login 或 register

  /**
   * 表单提交处理函数
   * @param values - 表单数据（邮箱和密码）
   */
  const onFinish = async (values: Record<string, string>) => {
    setLoading(true);
    try {
      // 根据当前标签页选择对应的 API 端点
      const endpoint = activeTab === "login" ? "/auth/login" : "/auth/register";
      const response = await api.post<AuthResponse>(endpoint, values);

      if (response.error) {
        return;
      }

      // 显示成功提示
      message.success(
        activeTab === "login"
          ? "Login successful!"
          : "Registration successful! Please check your email for confirmation."
      );

      // 登录成功后跳转到日程页面，注册成功后切换到登录标签页
      if (activeTab === "login") {
        router.push("/schedule");
      } else {
        setActiveTab("login");
      }
    } catch (error: unknown) {
      console.error("Auth error:", error);
      message.error("Login failed, please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      style={{
        width: "100%",
        maxWidth: 400,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 8 }}>
          {activeTab === "login" ? "Welcome Back" : "Create Account"}
        </Title>
        <Text type="secondary">
          {activeTab === "login"
            ? "Please enter your email and password to login"
            : "Please enter your email and password to create an account"}
        </Text>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        centered
        items={[
          { key: "login", label: "Login" },
          { key: "register", label: "Register" },
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
            { required: true, message: "Please enter your email address!" },
            { type: "email", message: "Please enter a valid email address!" },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="Email" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: "Please enter your password!" },
            { min: 6, message: "Password must be at least 6 characters!" },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Password" />
        </Form.Item>

        {activeTab === "register" && (
          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("The two passwords do not match!")
                  );
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm Password"
            />
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
            {activeTab === "login" ? "Login" : "Register Now"}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
