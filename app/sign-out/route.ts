import { createClient } from "../../utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  // Sign out by removing the session cookie
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/", process.env.VERCEL_URL || "http://localhost:3000"));
}
