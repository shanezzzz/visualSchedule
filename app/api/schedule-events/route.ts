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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Origin": "*",
    Vary: "Origin",
  };

  return headers;
}

/**
 * 根据日期字符串获取该日期的时间范围（一整天）
 * @param date - 日期字符串（格式：YYYY-MM-DD）
 * @returns 返回该日期从00:00:00到23:59:59.999的ISO时间范围，如果日期无效则返回null
 */
function getDateRange(date: string) {
  const startDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(startDate.getTime())) {
    return null;
  }
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  endDate.setUTCMilliseconds(endDate.getUTCMilliseconds() - 1);
  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
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
 * 获取日程事件列表
 * 支持按员工ID、时间范围或日期进行过滤
 * @param request - HTTP请求对象
 * @returns 返回日程事件列表或错误信息
 */
export async function GET(request: Request) {
  const corsHeaders = getCorsHeaders();
  const { searchParams } = new URL(request.url);
  // 从查询参数中获取过滤条件
  const employeeId = searchParams.get("employeeId");
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  const dateParam = searchParams.get("date");

  let startAt = startParam ?? undefined;
  let endAt = endParam ?? undefined;

  // 如果没有指定时间范围但指定了日期，则使用该日期的完整时间范围
  if (!startAt && !endAt && dateParam) {
    const range = getDateRange(dateParam);
    if (range) {
      startAt = range.start;
      endAt = range.end;
    }
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

  // 构建查询，根据参数添加过滤条件
  let query = supabase.from("schedule_events").select("*");

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }
  if (startAt) {
    // gte 是 greater than or equal to 的意思，表示大于等于
    query = query.gte("start_at", startAt);
  }
  if (endAt) {
    // lte 是 less than or equal to 的意思，表示小于等于
    query = query.lte("end_at", endAt);
  }

  // 执行查询，按开始时间升序排列
  const { data, error } = await query.order("start_at", { ascending: true });

  // 处理查询错误
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }

  // 返回日程事件列表
  return NextResponse.json({ events: data }, { headers: corsHeaders });
}

/**
 * 创建新的日程事件
 * @param request - HTTP请求对象
 * @returns 返回新创建的日程事件信息或错误信息
 */
export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders();
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

  // 提取字段值，支持多种字段名称格式（snake_case和camelCase）
  const title = payload.title;
  const startAt = payload.start_at ?? payload.start;
  const endAt = payload.end_at ?? payload.end;
  const employeeId = payload.employee_id ?? payload.employeeId;

  // 验证必填字段
  if (!title || !startAt || !endAt || !employeeId) {
    return NextResponse.json(
      { error: "title, start_at, end_at, employee_id are required." },
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

  // 插入新的日程事件数据
  const { data, error } = await supabase
    .from("schedule_events")
    .insert({
      title,
      description: payload.description ?? null,
      start_at: startAt,
      end_at: endAt,
      employee_id: employeeId,
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

  // 返回新创建的日程事件信息
  return NextResponse.json({ event: data }, { headers: corsHeaders });
}
