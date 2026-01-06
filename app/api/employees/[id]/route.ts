import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type EmployeePayload = {
  name?: string;
  role?: string;
  color?: string;
};

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

export async function OPTIONS() {
  const corsHeaders = getCorsHeaders();
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsHeaders = getCorsHeaders();
  const { id } = await params;

  let payload: EmployeePayload;
  try {
    payload = (await request.json()) as EmployeePayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: corsHeaders }
    );
  }

  const updates: EmployeePayload = {};

  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.role !== undefined) updates.role = payload.role;
  if (payload.color !== undefined) updates.color = payload.color;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update." },
      { status: 400, headers: corsHeaders }
    );
  }

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

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: corsHeaders }
    );
  }

  const { data, error } = await supabase
    .from("employees")
    .update(updates)
    .eq("id", id)
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsHeaders = getCorsHeaders();
  const { id } = await params;

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

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: corsHeaders }
    );
  }

  const { data, error } = await supabase
    .from("employees")
    .delete()
    .eq("id", id)
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
