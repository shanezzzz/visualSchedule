import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type LoginPayload = {
  email?: string;
  password?: string;
};

const ALLOWED_METHODS = "POST, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization";

function getCorsHeaders(origin: string | null) {
  const allowedOrigins = (process.env.NEXT_PUBLIC_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  let allowOrigin = "*";

  if (allowedOrigins.length > 0) {
    allowOrigin = origin && allowedOrigins.includes(origin) ? origin : "null";
  } else if (origin) {
    allowOrigin = origin;
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    Vary: "Origin",
  };
}

export async function OPTIONS(request: Request) {
  const corsHeaders = getCorsHeaders(request.headers.get("origin"));
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request.headers.get("origin"));
  let payload: LoginPayload;

  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: corsHeaders }
    );
  }

  const { email, password } = payload;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400, headers: corsHeaders }
    );
  }

  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase init failed." },
      { status: 500, headers: corsHeaders }
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 401, headers: corsHeaders }
    );
  }

  return NextResponse.json(
    {
      user: data.user,
      session: data.session,
    },
    { headers: corsHeaders }
  );
}
