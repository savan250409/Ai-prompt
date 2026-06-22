import { NextRequest, NextResponse } from "next/server";

function seedToInt(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Cinematic palettes [bg, mid, skin, accent, hi]
const PALETTES = [
  ["#0d0019", "#2d0057", "#c4855a", "#9b6dff", "#ffffff"],
  ["#00101a", "#003040", "#c49a6a", "#00b4d8", "#e0f7ff"],
  ["#1a0006", "#4d0018", "#d4906e", "#ff4d6d", "#ffe0e8"],
  ["#001a06", "#00401a", "#b8855a", "#00c853", "#c8ffd8"],
  ["#1a1200", "#403000", "#c4956a", "#ffb300", "#fff8e0"],
  ["#0a001a", "#200050", "#c07060", "#7c4dff", "#e8e0ff"],
  ["#001218", "#003040", "#c8906a", "#00bfa5", "#e0fffa"],
  ["#1a0010", "#450028", "#c4806a", "#e040fb", "#f8e0ff"],
];

// Route: GET /api/placeholder/[seed]/[w]/[h]
export function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ params: string[] }> },
) {
  return params.then(({ params: p }) => {
    const seed = p[0] ?? "default";
    const w = Math.min(Math.max(parseInt(p[1] ?? "800", 10), 1), 2000);
    const h = Math.min(Math.max(parseInt(p[2] ?? "800", 10), 1), 2000);

    const n = seedToInt(seed);
    const pal = PALETTES[n % PALETTES.length];
    const [bg, mid, skin, accent, hi] = pal;

    const cx = w * (0.42 + ((n >> 8) & 0xf) / 100);
    const cy = h * (0.30 + ((n >> 12) & 0xf) / 120);
    const headR = Math.min(w, h) * (0.155 + ((n >> 16) & 0xf) / 200);
    const shoulderW = headR * 2.8;
    const shoulderY = cy + headR * 1.15;
    const eyeOff = headR * 0.28;
    const eyeY = cy - headR * 0.08;
    const eyeR = headR * 0.095;
    const gx = w * (0.3 + ((n >> 20) & 0x1f) / 120);
    const gy = h * (0.15 + ((n >> 24) & 0x1f) / 160);

    // Hair style varies by seed (0=short, 1=long, 2=bun, 3=wavy)
    const hairStyle = n % 4;
    let hairPath = "";
    if (hairStyle === 0) {
      hairPath = `M${cx - headR * 1.05} ${cy - headR * 0.6} Q${cx - headR * 0.9} ${cy - headR * 1.55} ${cx} ${cy - headR * 1.6} Q${cx + headR * 0.9} ${cy - headR * 1.55} ${cx + headR * 1.05} ${cy - headR * 0.6} Q${cx} ${cy - headR * 0.75} ${cx - headR * 1.05} ${cy - headR * 0.6}Z`;
    } else if (hairStyle === 1) {
      hairPath = `M${cx - headR * 1.1} ${cy - headR * 0.5} Q${cx - headR} ${cy - headR * 1.6} ${cx} ${cy - headR * 1.65} Q${cx + headR} ${cy - headR * 1.6} ${cx + headR * 1.1} ${cy - headR * 0.5} L${cx + headR * 1.3} ${cy + headR * 2.2} Q${cx} ${cy + headR * 2.5} ${cx - headR * 1.3} ${cy + headR * 2.2}Z`;
    } else if (hairStyle === 2) {
      hairPath = `M${cx - headR * 0.95} ${cy - headR * 0.7} Q${cx - headR * 0.85} ${cy - headR * 1.5} ${cx} ${cy - headR * 1.55} Q${cx + headR * 0.85} ${cy - headR * 1.5} ${cx + headR * 0.95} ${cy - headR * 0.7}Z M${cx - headR * 0.22} ${cy - headR * 1.68} Q${cx} ${cy - headR * 2.0} ${cx + headR * 0.22} ${cy - headR * 1.68} Q${cx} ${cy - headR * 1.55} ${cx - headR * 0.22} ${cy - headR * 1.68}Z`;
    } else {
      hairPath = `M${cx - headR * 1.15} ${cy - headR * 0.4} Q${cx - headR * 1.1} ${cy - headR * 1.6} ${cx - headR * 0.3} ${cy - headR * 1.7} Q${cx} ${cy - headR * 1.75} ${cx + headR * 0.3} ${cy - headR * 1.7} Q${cx + headR * 1.1} ${cy - headR * 1.6} ${cx + headR * 1.15} ${cy - headR * 0.4} Q${cx + headR * 1.35} ${cy + headR * 0.8} ${cx + headR * 1.2} ${cy + headR * 1.8} Q${cx} ${cy + headR * 2.1} ${cx - headR * 1.2} ${cy + headR * 1.8} Q${cx - headR * 1.35} ${cy + headR * 0.8} ${cx - headR * 1.15} ${cy - headR * 0.4}Z`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="bgG" cx="${gx}" cy="${gy}" r="${Math.max(w, h) * 0.9}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${mid}"/>
      <stop offset="70%" stop-color="${bg}"/>
    </radialGradient>
    <radialGradient id="faceG" cx="${cx - headR * 0.15}" cy="${cy - headR * 0.2}" r="${headR * 1.1}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${hi}" stop-opacity="0.3"/>
      <stop offset="40%" stop-color="${skin}"/>
      <stop offset="100%" stop-color="${skin}" stop-opacity="0.75"/>
    </radialGradient>
    <radialGradient id="rimG" cx="${cx + headR * 0.8}" cy="${cy - headR * 0.3}" r="${headR * 0.9}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="scrimG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="40%" stop-color="${bg}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="0.82"/>
    </linearGradient>
    <linearGradient id="vigG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bg}" stop-opacity="0.5"/>
      <stop offset="28%" stop-color="${bg}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="shoulG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${skin}"/>
      <stop offset="100%" stop-color="${skin}" stop-opacity="0.3"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <rect width="${w}" height="${h}" fill="url(#bgG)"/>
  <ellipse cx="${cx}" cy="${shoulderY + headR * 1.4}" rx="${shoulderW}" ry="${headR * 1.6}" fill="url(#shoulG)" opacity="0.88"/>
  <rect x="${cx - headR * 0.22}" y="${cy + headR * 0.72}" width="${headR * 0.44}" height="${headR * 0.55}" fill="${skin}" opacity="0.85"/>
  <path d="${hairPath}" fill="${mid}" opacity="0.95"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${headR}" ry="${headR * 1.12}" fill="url(#faceG)"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${headR}" ry="${headR * 1.12}" fill="url(#rimG)"/>
  <ellipse cx="${cx - eyeOff}" cy="${eyeY}" rx="${eyeR}" ry="${eyeR * 0.62}" fill="${bg}" opacity="0.85"/>
  <ellipse cx="${cx + eyeOff}" cy="${eyeY}" rx="${eyeR}" ry="${eyeR * 0.62}" fill="${bg}" opacity="0.85"/>
  <circle cx="${cx - eyeOff + eyeR * 0.28}" cy="${eyeY - eyeR * 0.18}" r="${eyeR * 0.22}" fill="${hi}" opacity="0.9"/>
  <circle cx="${cx + eyeOff + eyeR * 0.28}" cy="${eyeY - eyeR * 0.18}" r="${eyeR * 0.22}" fill="${hi}" opacity="0.9"/>
  <ellipse cx="${cx}" cy="${cy + headR * 0.28}" rx="${headR * 0.065}" ry="${headR * 0.04}" fill="${bg}" opacity="0.22"/>
  <ellipse cx="${cx}" cy="${cy + headR * 0.55}" rx="${headR * 0.22}" ry="${headR * 0.085}" fill="${accent}" opacity="0.55"/>
  <ellipse cx="${cx + headR * 0.78}" cy="${cy}" rx="${headR * 0.18}" ry="${headR * 0.9}" fill="${accent}" opacity="0.28"/>
  <circle cx="${w * 0.12}" cy="${h * 0.18}" r="${w * 0.04}" fill="${accent}" opacity="0.09"/>
  <circle cx="${w * 0.85}" cy="${h * 0.22}" r="${w * 0.055}" fill="${hi}" opacity="0.07"/>
  <circle cx="${w * 0.08}" cy="${h * 0.72}" r="${w * 0.035}" fill="${accent}" opacity="0.08"/>
  <circle cx="${w * 0.9}" cy="${h * 0.65}" r="${w * 0.045}" fill="${hi}" opacity="0.06"/>
  <rect width="${w}" height="${h}" fill="url(#scrimG)"/>
  <rect width="${w}" height="${h}" fill="url(#vigG)"/>
</svg>`;

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  });
}
