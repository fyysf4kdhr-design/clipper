import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { publishJobs } from "@/db/schema";
import { advanceJob, getActiveConnection } from "@/lib/publishing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const [job] = await db.select().from(publishJobs).where(eq(publishJobs.id, id));
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const conn = await getActiveConnection();
  const advanced = await advanceJob(job, conn);
  return NextResponse.json({ job: advanced });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const [job] = await db.select().from(publishJobs).where(eq(publishJobs.id, id));
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!["queued", "uploading"].includes(job.status)) {
    return NextResponse.json(
      { error: `Cannot cancel a job that is ${job.status}.` },
      { status: 409 },
    );
  }
  const [updated] = await db
    .update(publishJobs)
    .set({ status: "canceled", progress: 0, updatedAt: new Date() })
    .where(eq(publishJobs.id, id))
    .returning();
  return NextResponse.json({ job: updated });
}
