import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_METHODS = "GET, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization";

function getCorsHeaders() {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
    "Access-Control-Allow-Origin": "*",
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

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "User not authenticated." },
      { status: 401, headers: corsHeaders }
    );
  }

  return NextResponse.json(
    { user: data.user },
    { headers: corsHeaders }
  );
}
