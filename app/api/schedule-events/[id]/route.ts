import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// 日程事件数据的类型定义（支持多种字段名称格式）
type EventPayload = {
  title?: string;
  description?: string;
  start_at?: string;
  end_at?: string;
  employee_id?: string;
  color?: string;
  start?: string;
  end?: string;
  employeeId?: string;
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
 * 更新指定日程事件的信息
 * @param request - HTTP请求对象
 * @param params - 路由参数，包含事件ID
 * @returns 返回更新后的日程事件信息或错误信息
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsHeaders = getCorsHeaders();
  const { id } = await params;

  let payload: EventPayload;
  // 解析请求体中的JSON数据
  try {
    payload = (await request.json()) as EventPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: corsHeaders }
    );
  }

  // 构建更新对象，只包含请求中提供的字段
  const updates: Record<string, unknown> = {};

  if (payload.title !== undefined) updates.title = payload.title;
  if (payload.description !== undefined)
    updates.description = payload.description;
  if (payload.color !== undefined) updates.color = payload.color;

  // 提取字段值，支持多种字段名称格式（snake_case和camelCase）
  const startAt = payload.start_at ?? payload.start;
  const endAt = payload.end_at ?? payload.end;
  const employeeId = payload.employee_id ?? payload.employeeId;

  if (startAt !== undefined) updates.start_at = startAt;
  if (endAt !== undefined) updates.end_at = endAt;
  if (employeeId !== undefined) updates.employee_id = employeeId;

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

  // 更新指定ID的日程事件
  const { data, error } = await supabase
    .from("schedule_events")
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

  // 返回更新后的日程事件信息
  return NextResponse.json({ event: data }, { headers: corsHeaders });
}

/**
 * 删除指定的日程事件
 * @param request - HTTP请求对象
 * @param params - 路由参数，包含事件ID
 * @returns 返回被删除的日程事件信息或错误信息
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

  // 删除指定ID的日程事件
  const { data, error } = await supabase
    .from("schedule_events")
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

  // 返回被删除的日程事件信息
  return NextResponse.json({ event: data }, { headers: corsHeaders });
}
