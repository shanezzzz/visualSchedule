import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
 * 处理用户登出请求
 * @returns 返回登出结果或错误信息
 */
export async function POST() {
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

  // 执行登出操作
  const { error } = await supabase.auth.signOut();

  // 处理登出错误
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }

  // 返回登出成功消息
  return NextResponse.json(
    { message: "Logged out successfully" },
    { headers: corsHeaders }
  );
}
