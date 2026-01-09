import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// 登录请求的数据类型定义
type LoginPayload = {
  email?: string;
  password?: string;
};

// 允许的HTTP方法
const ALLOWED_METHODS = "POST, OPTIONS";
// 允许的HTTP请求头
const ALLOWED_HEADERS = "Content-Type, Authorization";

/**
 * 获取CORS响应头
 * @returns CORS配置的响应头对象
 */
function getCorsHeaders() {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Origin": "*",
    "Vary": "Origin",
  };

  return headers;
}

/**
 * 处理OPTIONS预检请求
 * 用于CORS跨域请求的预检
 */
export async function OPTIONS() {
  const corsHeaders = getCorsHeaders();
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * 处理用户登录请求
 * @param request - HTTP请求对象
 * @returns 返回登录结果，包含用户信息或错误信息
 */
export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders();
  let payload: LoginPayload;

  // 解析请求体中的JSON数据
  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: corsHeaders }
    );
  }

  const { email, password } = payload;

  // 验证必填字段
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400, headers: corsHeaders }
    );
  }

  // 初始化Supabase客户端
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase init failed." },
      { status: 500, headers: corsHeaders }
    );
  }

  // 使用Supabase进行密码登录
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // 处理登录错误
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 401, headers: corsHeaders }
    );
  }

  // 返回登录成功的用户信息
  return NextResponse.json(
    {
      user: data.user,
    },
    { headers: corsHeaders }
  );
}
