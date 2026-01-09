import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// 注册请求的数据类型定义
type RegisterPayload = {
  email?: string;
  password?: string;
};

/**
 * 处理用户注册请求
 * @param request - HTTP请求对象
 * @returns 返回注册结果，包含用户信息和会话信息或错误信息
 */
export async function POST(request: Request) {
  let payload: RegisterPayload;

  // 解析请求体中的JSON数据
  try {
    payload = (await request.json()) as RegisterPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { email, password } = payload;

  // 验证必填字段
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  // 初始化Supabase客户端
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase init failed." },
      { status: 500 }
    );
  }

  // 使用Supabase创建新用户
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  // 处理注册错误
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 从邮箱地址提取默认用户名（邮箱@符号前的部分）
  const userEmail = data.user?.email ?? email;
  const defaultName = userEmail.split("@")[0] || "user";

  // 为新用户自动创建一个默认员工记录
  const { error: employeeError } = await supabase
    .from("employees")
    .insert({
      name: defaultName,
    });

  // 如果创建员工记录失败，记录警告但不影响注册流程
  if (employeeError) {
    console.warn("Failed to create default employee:", employeeError.message);
  }

  // 返回注册成功的用户和会话信息
  return NextResponse.json({
    user: data.user,
    session: data.session,
  });
}
