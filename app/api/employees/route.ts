import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type EmployeePayload = {
  name?: string;
  role?: string;
  color?: string;
};

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

export async function OPTIONS() {
  const corsHeaders = getCorsHeaders();
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const corsHeaders = getCorsHeaders();

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase init failed." },
      { status: 500, headers: corsHeaders }
    );
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: corsHeaders }
    );
  }

  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }

  return NextResponse.json({ employees: data }, { headers: corsHeaders });
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders();
  let payload: EmployeePayload;

  try {
    payload = (await request.json()) as EmployeePayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: corsHeaders }
    );
  }

  if (!payload.name) {
    return NextResponse.json(
      { error: "Name is required." },
      { status: 400, headers: corsHeaders }
    );
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase init failed." },
      { status: 500, headers: corsHeaders }
    );
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: corsHeaders }
    );
  }

  const { data, error } = await supabase
    .from("employees")
    .insert({
      name: payload.name,
      role: payload.role ?? null,
      color: payload.color ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: corsHeaders }
    );
  }

  return NextResponse.json({ employee: data }, { headers: corsHeaders });
}
