import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/db";
import { projects } from "@/db/schema";
import Nav from "@/components/Nav";
import ProjectView from "@/components/ProjectView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [p] = await db.select().from(projects).where(eq(projects.id, id));
  return { title: p ? `${p.title} — KLYP` : "KLYP" };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [p] = await db.select().from(projects).where(eq(projects.id, id));
  if (!p) notFound();

  return (
    <main className="relative min-h-screen">
      <Nav />
      <div className="grid-bg absolute inset-x-0 top-0 h-[420px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="relative mx-auto max-w-[1400px] px-5 pb-24 pt-28 md:px-8 md:pt-36">
        <ProjectView
          project={{
            id: p.id,
            url: p.url,
            videoId: p.videoId,
            title: p.title,
            channel: p.channel,
            durationSeconds: p.durationSeconds,
            status: p.status,
            autoPostMinScore: p.autoPostMinScore,
            createdAt: p.createdAt.toISOString(),
          }}
        />
      </div>
    </main>
  );
}
