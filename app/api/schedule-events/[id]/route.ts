import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  let payload: EventPayload;
  try {
    payload = (await request.json()) as EventPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: corsHeaders }
    );
  }

  const updates: Record<string, unknown> = {};

  if (payload.title !== undefined) updates.title = payload.title;
  if (payload.description !== undefined)
    updates.description = payload.description;
  if (payload.color !== undefined) updates.color = payload.color;

  const startAt = payload.start_at ?? payload.start;
  const endAt = payload.end_at ?? payload.end;
  const employeeId = payload.employee_id ?? payload.employeeId;

  if (startAt !== undefined) updates.start_at = startAt;
  if (endAt !== undefined) updates.end_at = endAt;
  if (employeeId !== undefined) updates.employee_id = employeeId;

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
    .from("schedule_events")
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

  return NextResponse.json({ event: data }, { headers: corsHeaders });
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
    .from("schedule_events")
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

  return NextResponse.json({ event: data }, { headers: corsHeaders });
}
