export type VideoMeta = {
  videoId: string;
  title: string;
  channel: string;
  durationSeconds: number | null;
};

/** Extract a YouTube video id from most URL shapes (or a raw 11-char id). */
export function extractVideoId(raw: string): string | null {
  const input = raw.trim();
  if (!input) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

  let url: URL;
  try {
    url = new URL(input.startsWith("http") ? input : `https://${input}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www\.|m\.)/, "");

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  }

  if (host.endsWith("youtube.com")) {
    const v = url.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    const m = url.pathname.match(/^\/(shorts|embed|live)\/([a-zA-Z0-9_-]{11})/);
    if (m) return m[2];
  }

  return null;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]).catch(() => null);
}

/**
 * Fetch title / channel via the public oEmbed endpoint and try to scrape the
 * real duration from the watch page. Degrades gracefully when YouTube blocks
 * datacenter requests — we never fail the pipeline because of metadata.
 */
export async function fetchVideoMeta(videoId: string): Promise<VideoMeta> {
  const fallback: VideoMeta = {
    videoId,
    title: "Untitled video",
    channel: "Unknown channel",
    durationSeconds: null,
  };

  const headers = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "accept-language": "en-US,en;q=0.9",
  };

  const oembedP = (async () => {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { headers },
    );
    if (!res.ok) throw new Error("oembed failed");
    return (await res.json()) as { title?: string; author_name?: string };
  })();

  const pageP = (async () => {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers,
    });
    if (!res.ok) throw new Error("watch page failed");
    return await res.text();
  })();

  const [oembed, page] = await Promise.all([
    withTimeout(oembedP, 6000),
    withTimeout(pageP, 7000),
  ]);

  const meta = { ...fallback };

  if (oembed?.title) meta.title = oembed.title;
  if (oembed?.author_name) meta.channel = oembed.author_name;

  if (page) {
    const len = page.match(/"lengthSeconds":"(\d+)"/);
    if (len) {
      const s = parseInt(len[1], 10);
      if (s > 0 && s < 6 * 3600) meta.durationSeconds = s;
    }
    if (!oembed?.title) {
      const t = page.match(/"title":"([^"]{4,200})"/);
      if (t) meta.title = t[1];
    }
    if (!oembed?.author_name) {
      const c = page.match(/"ownerChannelName":"([^"]{1,100})"/);
      if (c) meta.channel = c[1];
    }
  }

  return meta;
}
