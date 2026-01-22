"use client";

import { App } from "antd";
import { useEffect } from "react";

// Global message instance
let globalMessage: ReturnType<typeof App.useApp>["message"] | null = null;

export function getGlobalMessage() {
  return globalMessage;
}

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const { message } = App.useApp();

  useEffect(() => {
    globalMessage = message;
  }, [message]);

  return <>{children}</>;
}
