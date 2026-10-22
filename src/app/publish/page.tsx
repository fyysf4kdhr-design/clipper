import Nav from "@/components/Nav";
import PublishCenter from "@/components/PublishCenter";
import { listPublishData } from "@/lib/publishing";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Publish — KLYP",
};

export default async function PublishPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const data = await listPublishData();

  return (
    <main className="relative min-h-screen">
      <Nav />
      <div className="grid-bg absolute inset-x-0 top-0 h-[420px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="relative mx-auto max-w-[1100px] px-5 pb-24 pt-28 md:px-8 md:pt-36">
        <PublishCenter
          initialConnection={data.connection}
          initialJobs={data.jobs}
          mode={data.mode}
          justConnected={params.connected === "1"}
          oauthError={params.error ?? null}
        />
      </div>
    </main>
  );
}
