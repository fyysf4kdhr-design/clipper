import { Resvg } from "@resvg/resvg-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const INK = "#07070C";
const ACID = "#C8FF2E";
const CREAM = "#EDEDE6";

/**
 * KLYP mark: an acid slash (the "cut") over a cream bar (the clip),
 * scaled from the 64x64 favicon geometry into a 512 canvas.
 */
function tileSvg({ maskable = false }) {
  const scale = maskable ? 4.4 : 6;
  const tx = 256 - 32 * scale;
  const ty = 256 - 29 * scale;
  const rx = maskable ? 0 : 112;
  const glow = maskable ? 0.2 : 0.15;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="glow" cx="50%" cy="46%" r="65%">
      <stop offset="0%" stop-color="${ACID}" stop-opacity="${glow}"/>
      <stop offset="60%" stop-color="${ACID}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="${rx}" fill="${INK}"/>
  <rect width="512" height="512" rx="${rx}" fill="url(#glow)"/>
  ${
    maskable
      ? ""
      : `<rect x="7" y="7" width="498" height="498" rx="${rx - 6}" fill="none" stroke="${CREAM}" stroke-opacity="0.09" stroke-width="2.5"/>`
  }
  <g transform="translate(${tx},${ty}) scale(${scale})">
    <rect x="8" y="40" width="20" height="7" rx="3.5" fill="${CREAM}" fill-opacity="0.22"/>
    <path d="M14 44 L32 14 L38 20 L24 44 Z" fill="${ACID}"/>
    <rect x="36" y="38" width="14" height="6" rx="3" fill="${CREAM}"/>
    <circle cx="46.5" cy="19" r="2.6" fill="${ACID}" fill-opacity="0.9"/>
  </g>
</svg>`;
}

function render(svg, size, out) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    background: "rgba(0,0,0,0)",
  });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, resvg.render().asPng());
  console.log(`✓ ${out} (${size}x${size})`);
}

const standard = tileSvg({ maskable: false });
const maskable = tileSvg({ maskable: true });

render(standard, 192, "public/icons/icon-192.png");
render(standard, 512, "public/icons/icon-512.png");
render(maskable, 512, "public/icons/icon-512-maskable.png");
render(maskable, 180, "public/icons/apple-touch-icon.png");
console.log("done");
