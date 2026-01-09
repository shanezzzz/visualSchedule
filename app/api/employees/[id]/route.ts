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
    "Access-Control-Allow-Methods": "PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Origin": "*",
    Vary: "Origin",
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
 * 更新指定员工的信息
 * @param request - HTTP请求对象
 * @param params - 路由参数，包含员工ID
 * @returns 返回更新后的员工信息或错误信息
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsHeaders = getCorsHeaders();
  const { id } = await params;

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

  // 构建更新对象，只包含请求中提供的字段
  const updates: EmployeePayload = {};

  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.role !== undefined) updates.role = payload.role;
  if (payload.color !== undefined) updates.color = payload.color;

  // 验证是否有有效的更新字段
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update." },
      { status: 400, headers: corsHeaders }
    );
  }

  // 初始化Supabase客户端
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Supabase init failed.",
      },
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

  // 更新指定ID的员工信息
  const { data, error } = await supabase
    .from("employees")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  // 处理更新错误
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: corsHeaders }
    );
  }

  // 返回更新后的员工信息
  return NextResponse.json({ employee: data }, { headers: corsHeaders });
}

/**
 * 删除指定的员工
 * @param request - HTTP请求对象
 * @param params - 路由参数，包含员工ID
 * @returns 返回被删除的员工信息或错误信息
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsHeaders = getCorsHeaders();
  const { id } = await params;

  // 初始化Supabase客户端
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Supabase init failed.",
      },
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

  // 删除指定ID的员工
  const { data, error } = await supabase
    .from("employees")
    .delete()
    .eq("id", id)
    .select("*")
    .single();

  // 处理删除错误
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: corsHeaders }
    );
  }

  // 返回被删除的员工信息
  return NextResponse.json({ employee: data }, { headers: corsHeaders });
}
