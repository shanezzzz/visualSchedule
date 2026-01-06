"use client";

import { Card, Typography } from "antd";

const { Paragraph, Title, Text } = Typography;

export default function LoginPage() {
  return (
    <Card style={{ width: "100%", maxWidth: 480 }}>
      <Title level={3}>Login / Register</Title>
      <Paragraph>
        Placeholder area for the login and registration page. Add forms, OTP,
        and third-party login options here later.
      </Paragraph>
      <Paragraph>
        <Text type="secondary">
          Example fields: username, password, confirm password, email.
        </Text>
      </Paragraph>
    </Card>
  );
}
