import { randomBytes } from "crypto";

export const TT_SCOPE = "user.info.basic,video.upload,video.publish";

/**
 * TikTok publishing is enabled only when real API credentials are configured.
 */
export function getTikTokConfig() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY ?? "";
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET ?? "";
  return {
    mode: (clientKey && clientSecret ? "live" : "unavailable") as
      | "live"
      | "unavailable",
    clientKey,
    clientSecret,
  };
}

export function newOAuthState(): string {
  return randomBytes(12).toString("hex");
}

export function callbackUrl(origin: string): string {
  return `${origin}/api/integrations/tiktok/callback`;
}

export function buildAuthorizeUrl(origin: string, state: string): string {
  const { clientKey } = getTikTokConfig();
  const params = new URLSearchParams({
    client_key: clientKey,
    redirect_uri: callbackUrl(origin),
    scope: TT_SCOPE,
    response_type: "code",
    state,
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

export async function exchangeCodeForToken(origin: string, code: string) {
  const { clientKey, clientSecret } = getTikTokConfig();
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: callbackUrl(origin),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || `token exchange failed (${res.status})`);
  }
  return data as {
    access_token: string;
    refresh_token?: string;
    open_id?: string;
  };
}

export async function fetchTikTokProfile(accessToken: string) {
  const res = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
    { headers: { authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`profile fetch failed (${res.status})`);
  const data = await res.json();
  return (data?.data?.user ?? {}) as {
    open_id?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

/** Live upload init via PULL_FROM_URL. Requires a publicly reachable MP4. */
export async function liveInitPost(
  accessToken: string,
  opts: { title: string; privacyLevel: string; videoUrl: string },
) {
  const res = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/video/init/",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: opts.title,
          privacy_level: opts.privacyLevel,
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: { source: "PULL_FROM_URL", video_url: opts.videoUrl },
      }),
    },
  );
  const data = await res.json().catch(() => ({}));
  const publishId = data?.data?.publish_id as string | undefined;
  if (!res.ok || !publishId) {
    throw new Error(
      data?.error?.message || `publish init failed (${res.status})`,
    );
  }
  return publishId;
}

export async function liveStatusCheck(accessToken: string, publishId: string) {
  const res = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/status/fetch/",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({ publish_id: publishId }),
    },
  );
  const data = await res.json().catch(() => ({}));
  return (data?.data?.status ?? "FAILED") as string;
}

