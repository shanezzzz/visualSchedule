import axios from "axios";
import { getGlobalMessage } from "@/app/components/MessageProvider";

export type ApiError = {
  message: string;
  status?: number;
};

export type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
};

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

function parseError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const payload = error.response?.data as
      | { error?: unknown; message?: string }
      | string
      | undefined;

    let message = "Network error, please check your connection.";

    if (typeof payload === "string") {
      message = payload;
    } else if (payload?.error) {
      message =
        typeof payload.error === "string"
          ? payload.error
          : (payload.error as { message?: string }).message ?? message;
    } else if (payload?.message) {
      message = payload.message;
    } else if (error.message) {
      message = error.message;
    }

    return { message, status };
  }

  return { message: "Unknown error." };
}

function handleUnauthorized(status?: number) {
  if (status === 401 && typeof window !== "undefined") {
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }
}

function showErrorNotification(error: ApiError) {
  // Only show notifications on the client side
  if (typeof window !== "undefined") {
    const message = getGlobalMessage();

    // If message API is not ready yet, fallback to console
    if (!message) {
      console.error("Error:", error.message);
      return;
    }

    // Use different message types based on status code
    if (error.status === 401) {
      // Check if we're on the login page - show specific error
      if (window.location.pathname === "/login") {
        message.error(error?.message ?? "Invalid email or password");
      } else {
        message.warning("Session expired. Redirecting to login...");
      }
    } else if (error.status === 403) {
      message.error("Access denied");
    } else if (error.status === 404) {
      message.warning("Resource not found");
    } else if (error.status && error.status >= 500) {
      message.error("Server error. Please try again later.");
    } else {
      message.error(error?.message ?? "An error occurred");
    }
  }
}

async function request<T>(
  method: "get" | "post" | "put" | "delete" | "patch",
  url: string,
  data?: unknown
): Promise<ApiResponse<T>> {
  try {
    const response = await client.request<T>({
      method,
      url,
      data,
    });
    return { data: response.data ?? null, error: null };
  } catch (error) {
    const parsed = parseError(error);
    handleUnauthorized(parsed.status);
    showErrorNotification(parsed);
    return { data: null, error: parsed };
  }
}

const api = {
  get: <T>(url: string) => request<T>("get", url),
  post: <T>(url: string, data?: unknown) => request<T>("post", url, data),
  put: <T>(url: string, data?: unknown) => request<T>("put", url, data),
  delete: <T>(url: string) => request<T>("delete", url),
  patch: <T>(url: string, data?: unknown) => request<T>("patch", url, data),
};

export default api;
