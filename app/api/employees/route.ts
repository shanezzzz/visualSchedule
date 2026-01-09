import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// 员工数据的类型定义
type EmployeePayload = {
  name?: string;
  role?: string;
  color?: string;
};

/**
 * 获取CORS响应头
 * @returns CORS配置的响应头对象
 */
function getCorsHeaders() {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
 * 获取所有员工列表
 * @returns 返回员工列表或错误信息
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

  // 验证用户是否已登录
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: corsHeaders }
    );
  }

  // 查询所有员工，按创建时间升序排列
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: true });

  // 处理查询错误
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }

  // 返回员工列表
  return NextResponse.json({ employees: data }, { headers: corsHeaders });
}

/**
 * 创建新员工
 * @param request - HTTP请求对象
 * @returns 返回新创建的员工信息或错误信息
 */
export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders();
  let payload: EmployeePayload;

  // 解析请求体中的JSON数据
  try {
    payload = (await request.json()) as EmployeePayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: corsHeaders }
    );
  }

  // 验证必填字段
  if (!payload.name) {
    return NextResponse.json(
      { error: "Name is required." },
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

  // 验证用户是否已登录
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: corsHeaders }
    );
  }

  // 插入新员工数据
  const { data, error } = await supabase
    .from("employees")
    .insert({
      name: payload.name,
      role: payload.role ?? null,
      color: payload.color ?? null,
    })
    .select("*")
    .single();

  // 处理插入错误
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: corsHeaders }
    );
  }

  // 返回新创建的员工信息
  return NextResponse.json({ employee: data }, { headers: corsHeaders });
}
