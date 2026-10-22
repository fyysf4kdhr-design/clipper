import type { Caption } from "@/db/schema";
import { hashSeed, mulberry32, pick, int } from "./rng";

export type GeneratedClip = {
  idx: number;
  title: string;
  hook: string;
  summary: string;
  reason: string;
  startSeconds: number;
  endSeconds: number;
  score: number;
  hashtags: string[];
  captions: Caption[];
};

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "at", "by", "from", "is", "are", "was", "were", "be", "been", "it", "its",
  "this", "that", "these", "those", "you", "your", "i", "we", "they", "he",
  "she", "my", "our", "their", "his", "her", "how", "why", "what", "when",
  "will", "would", "can", "could", "should", "do", "does", "did", "not",
  "no", "yes", "so", "if", "than", "then", "too", "very", "just", "about",
  "into", "over", "after", "before", "up", "down", "out", "off", "again",
  "new", "get", "got", "make", "made", "like", "vs", "ft", "feat",
  "official", "video", "full", "hd", "4k", "part", "ep", "episode",
]);

const FALLBACK_WORDS = [
  "moment", "story", "secret", "idea", "trick", "mistake", "truth", "lesson",
];

export function extractKeywords(title: string): string[] {
  const words = title
    .replace(/[\[\](){}|#@:;,.!?'"“”$£€&*+=/\\_-]+/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOPWORDS.has(w.toLowerCase()) && !/^\d+$/.test(w));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    const k = w.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(w.replace(/^(.)/, (c) => c.toUpperCase()));
    }
    if (out.length >= 8) break;
  }
  return out.length ? out : FALLBACK_WORDS.slice();
}

const TITLE_TEMPLATES: ((k: string, k2: string, len: number) => string)[] = [
  (k) => `The ${k} detail everyone missed`,
  (k) => `Why ${k} actually matters`,
  (k, _k2, len) => `${k} — explained in ${len} seconds`,
  (k) => `The exact moment ${k} went off`,
  (k) => `Stop getting ${k} wrong`,
  (k, k2) => `${k} vs ${k2}: the honest answer`,
  (k) => `This will change how you see ${k}`,
  (k) => `POV: ${k} finally clicks`,
  (k) => `The ${k} breakdown nobody asked for`,
  (k, _k2, len) => `${k} in under ${len + 3} seconds`,
  (k) => `${k}: the part they cut from the interview`,
  (k) => `Wait for the ${k} reveal`,
];

const HOOK_TEMPLATES: ((k: string, k2: string) => string)[] = [
  (k) => `Nobody talks about this side of ${k.toLowerCase()}.`,
  (k) => `This is where ${k.toLowerCase()} gets interesting.`,
  (k) => `You were told ${k.toLowerCase()} was simple. It is not.`,
  (k) => `The ${k.toLowerCase()} part rewired my brain.`,
  (k, k2) => `${k} meets ${k2.toLowerCase()} — and it escalates fast.`,
  (k) => `If you only watch ${k.toLowerCase()} once, watch this bit.`,
  (k) => `Three seconds in and ${k.toLowerCase()} already pays off.`,
  (k) => `The comment section found this ${k.toLowerCase()} moment first.`,
];

const SUMMARY_TEMPLATES: ((k: string, k2: string) => string)[] = [
  (k) => `A tight, self-contained segment where ${k.toLowerCase()} is broken down with a clear setup and payoff — ideal as a standalone short.`,
  (k) => `Strong cold open, rising tension and a quotable finish around ${k.toLowerCase()}. Minimal context needed for new viewers.`,
  (k, k2) => `The ${k.toLowerCase()} argument lands hardest here, with a natural callback to ${k2.toLowerCase()}. Captions carry it without sound.`,
  (k) => `Fast pacing plus a genuine reaction beat make this the most replayable ${k.toLowerCase()} stretch of the video.`,
];

const REASON_TEMPLATES: string[] = [
  "Emotional spike + punchy one-liner in the first 3 seconds",
  "Pattern interrupt detected at the open — strong retention signal",
  "High comment-density segment with a quotable payoff",
  "Clear setup/payoff arc that works without prior context",
  "Speaker energy peaks here; caption rhythm stays under 3 words per beat",
  "Self-contained story beat — no pruned context, ready for Shorts",
  "Loopable ending lines up with the hook — strong rewatch trigger",
];

const CAPTION_BANK: ((k: string, k2: string) => string)[] = [
  (k) => `so here is the thing about ${k.toLowerCase()}`,
  (k) => `nobody explains ${k.toLowerCase()} like this`,
  (k) => `and this is where it clicks`,
  (k, k2) => `it connects straight back to ${k2.toLowerCase()}`,
  (k) => `that is the part most people miss`,
  () => `wait — watch what happens next`,
  () => `this changes the whole argument`,
  (k) => `once you see ${k.toLowerCase()}, you cannot unsee it`,
  () => `and that right there is the payoff`,
  () => `save this before it gets buried`,
];

/**
 * Run the deterministic "AI" analysis for a video. Given the same video id it
 * will always emit the same clips, which makes the pipeline feel consistent.
 */
export function analyzeVideo(
  videoId: string,
  title: string,
  durationSeconds: number | null,
): GeneratedClip[] {
  const seed = hashSeed(`klyp:${videoId}`);
  const rng = mulberry32(seed);
  const keywords = extractKeywords(title);

  const known = durationSeconds != null && durationSeconds > 0;
  const duration = known ? (durationSeconds as number) : 480 + int(rng, 0, 1140);

  // Genuinely short sources (Shorts, trailers) already ARE the moment —
  // cut fewer, tighter clips instead of pretending it's long-form.
  let clipCount: number;
  let lenRange: [number, number];
  if (known && duration >= 30 && duration < 90) {
    clipCount = 1;
    lenRange = [30, Math.min(60, Math.floor(duration))];
  } else if (known && duration < 30) {
    clipCount = duration < 45 ? 1 : 2;
    lenRange = [
      Math.max(6, Math.floor(duration * 0.4)),
      Math.max(10, Math.floor(duration * 0.78)),
    ];
  } else {
    clipCount = 5 + Math.floor(rng() * 2); // 5–6 clips
    lenRange = [30, 60];
  }

  const marginStart = duration <= 60 ? 0 : Math.min(30, duration * 0.04);
  const marginEnd = duration <= 60 ? 0 : Math.min(45, duration * 0.06);
  const usable = Math.max(6, duration - marginStart - marginEnd);
  const windowLen = usable / clipCount;

  const usedTemplates = new Set<number>();
  const raw: GeneratedClip[] = [];

  for (let i = 0; i < clipCount; i++) {
    const k = keywords[Math.floor(rng() * keywords.length)];
    let k2 = keywords[Math.floor(rng() * keywords.length)];
    if (k2 === k) k2 = keywords[(keywords.indexOf(k) + 1) % keywords.length];

    const len = Math.min(int(rng, lenRange[0], lenRange[1]), Math.round(usable));
    const wStart = marginStart + i * windowLen;
    const wEnd = Math.min(wStart + windowLen, duration - marginEnd);
    const maxStart = Math.max(wStart, wEnd - len);
    const start = Math.round(wStart + rng() * Math.max(0, maxStart - wStart));

    let tpl = Math.floor(rng() * TITLE_TEMPLATES.length);
    if (usedTemplates.has(tpl)) tpl = (tpl + 1) % TITLE_TEMPLATES.length;
    usedTemplates.add(tpl);

    const score = Math.min(
      98,
      Math.round(68 + rng() * 26 + (i === 0 ? 4 : 0) + rng() * 4),
    );

    const capCount = int(rng, 4, 6);
    const captions: Caption[] = [];
    for (let c = 0; c < capCount; c++) {
      const t0 = Math.round(((c / capCount) * len + (c === 0 ? 0 : rng() * 1.4)) * 10) / 10;
      const t1 = Math.round((((c + 1) / capCount) * len) * 10) / 10;
      const line = c === 0 ? pick(rng, HOOK_TEMPLATES)(k, k2) : pick(rng, CAPTION_BANK)(k, k2);
      captions.push({ t0, t1, text: line });
    }

    raw.push({
      idx: 0,
      title: TITLE_TEMPLATES[tpl](k, k2, len),
      hook: pick(rng, HOOK_TEMPLATES)(k, k2),
      summary: pick(rng, SUMMARY_TEMPLATES)(k, k2),
      reason: pick(rng, REASON_TEMPLATES),
      startSeconds: start,
      endSeconds: Math.min(duration, start + len),
      score,
      hashtags: [
        "shorts",
        "viral",
        "clips",
        ...[k, k2]
          .slice(0, 2)
          .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ""))
          .filter(Boolean),
      ].filter((t, i, arr) => arr.indexOf(t) === i),
      captions,
    });
  }

  raw.sort((a, b) => b.score - a.score);
  raw.forEach((c, i) => (c.idx = i + 1));
  return raw;
}
