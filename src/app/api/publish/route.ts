import { NextResponse } from "next/server";
import { listPublishData } from "@/lib/publishing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await listPublishData();
  return NextResponse.json(data);
}
