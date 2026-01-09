import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// 允许的HTTP方法
const ALLOWED_METHODS = "GET, OPTIONS";
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
    "Vary": "Origin",
    "Access-Control-Allow-Origin": "*",
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
 * 获取当前登录用户的信息
 * @returns 返回当前用户信息或错误信息
 */
export async function GET() {
  const corsHeaders = getCorsHeaders();

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

  // 获取当前认证用户
  const { data, error } = await supabase.auth.getUser();

  // 验证用户是否已认证
  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "User not authenticated." },
      { status: 401, headers: corsHeaders }
    );
  }

  // 返回用户信息
  return NextResponse.json(
    { user: data.user },
    { headers: corsHeaders }
  );
}
