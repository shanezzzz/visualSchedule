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

function getCorsHeaders(origin: string | null) {
  const allowedOrigins = (process.env.NEXT_PUBLIC_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  let allowOrigin: string | null = null;

  if (origin) {
    if (allowedOrigins.length > 0) {
      allowOrigin = allowedOrigins.includes(origin) ? origin : null;
    } else {
      allowOrigin = origin;
    }
  }

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };

  if (allowOrigin) {
    headers["Access-Control-Allow-Origin"] = allowOrigin;
    headers["Vary"] = "Origin";
  }

  return headers;
}

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

export async function OPTIONS(request: Request) {
  const corsHeaders = getCorsHeaders(request.headers.get("origin"));
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
  const corsHeaders = getCorsHeaders(request.headers.get("origin"));
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  const dateParam = searchParams.get("date");

  let startAt = startParam ?? undefined;
  let endAt = endParam ?? undefined;

  if (!startAt && !endAt && dateParam) {
    const range = getDateRange(dateParam);
    if (range) {
      startAt = range.start;
      endAt = range.end;
    }
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

  let query = supabase.from("schedule_events").select("*");

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }
  if (startAt) {
    query = query.gte("start_at", startAt);
  }
  if (endAt) {
    query = query.lte("end_at", endAt);
  }

  const { data, error } = await query.order("start_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }

  return NextResponse.json({ events: data }, { headers: corsHeaders });
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request.headers.get("origin"));
  let payload: EventPayload;

  try {
    payload = (await request.json()) as EventPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: corsHeaders }
    );
  }

  const title = payload.title;
  const startAt = payload.start_at ?? payload.start;
  const endAt = payload.end_at ?? payload.end;
  const employeeId = payload.employee_id ?? payload.employeeId;

  if (!title || !startAt || !endAt || !employeeId) {
    return NextResponse.json(
      { error: "title, start_at, end_at, employee_id are required." },
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

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: corsHeaders }
    );
  }

  return NextResponse.json({ event: data }, { headers: corsHeaders });
}
