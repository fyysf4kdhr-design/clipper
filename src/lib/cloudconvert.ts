type CloudConvertTask = {
  name: string;
  status: string;
  message?: string;
  result?: { files?: Array<{ url?: string }> };
};

type CloudConvertJobResponse = {
  data?: {
    id?: string;
    status?: string;
    message?: string;
    tasks?: CloudConvertTask[];
  };
};

function apiHeaders(): HeadersInit {
  const apiKey = process.env.CLOUDCONVERT_API_KEY;
  if (!apiKey) throw new Error("CLOUDCONVERT_API_KEY is not configured.");
  return {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
  };
}

export async function createClipRenderJob(
  sourceUrl: string,
  clipId: string,
  startSeconds: number,
  endSeconds: number,
): Promise<string> {
  const response = await fetch("https://api.cloudconvert.com/v2/jobs", {
    method: "POST",
    headers: apiHeaders(),
    signal: AbortSignal.timeout(20_000),
    body: JSON.stringify({
      tag: `clip-${clipId}`,
      tasks: {
        "import-source": {
          operation: "import/url",
          url: sourceUrl,
        },
        "render-clip": {
          operation: "convert",
          input: "import-source",
          output_format: "mp4",
          engine: "ffmpeg",
          trim: { start: startSeconds, end: endSeconds },
          filename: `${clipId}.mp4`,
        },
        "export-clip": {
          operation: "export/url",
          input: "render-clip",
        },
      },
    }),
  });

  const body = (await response.json().catch(() => ({}))) as CloudConvertJobResponse;
  const jobId = body.data?.id;
  if (!response.ok || !jobId) {
    throw new Error(body.data?.message ?? `CloudConvert job failed (${response.status}).`);
  }
  return jobId;
}

export async function getClipRender(jobId: string): Promise<{
  url: string | null;
  pending: boolean;
  error: string | null;
}> {
  const response = await fetch(
    `https://api.cloudconvert.com/v2/jobs/${encodeURIComponent(jobId)}?include=tasks`,
    { headers: apiHeaders(), signal: AbortSignal.timeout(15_000) },
  );
  const body = (await response.json().catch(() => ({}))) as CloudConvertJobResponse;
  if (!response.ok || !body.data) {
    return {
      url: null,
      pending: false,
      error: body.data?.message ?? `Could not check CloudConvert job (${response.status}).`,
    };
  }

  const exportTask = body.data.tasks?.find((task) => task.name === "export-clip");
  const url = exportTask?.result?.files?.[0]?.url;
  if (url) return { url, pending: false, error: null };
  if (body.data.status === "error" || exportTask?.status === "error") {
    return {
      url: null,
      pending: false,
      error: exportTask?.message ?? body.data.message ?? "CloudConvert could not render this clip.",
    };
  }
  return { url: null, pending: true, error: null };
}