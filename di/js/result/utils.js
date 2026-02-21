// /di/js/result/utils.js
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export const toNum = (v, d = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
};

export function safeUserName() {
  try {
    if (typeof window.getUserName === "function") {
      const n = window.getUserName();
      if (typeof n === "string" && n.trim()) return n.trim();
    }
  } catch {}
  return null;
}

// Resonance can be 0..1 or 0..100
export function normalizePercent(resonance) {
  let r = toNum(resonance, 0);
  if (r <= 1.0001) r *= 100;
  return clamp(Math.round(r), 0, 100);
}

// Score normalization strategy:
// - prefer maxCombo proxy: maxCombo * 120
// - fallback: soft log
// - fallback: resonance
export function normalizeScore01(score, maxCombo, resonancePercent) {
  const s = Math.max(0, toNum(score, 0));
  const mc = Math.max(0, toNum(maxCombo, 0));
  const proxyMax = mc > 0 ? mc * 120 : 0;

  if (proxyMax >= 240) return clamp(s / proxyMax, 0, 1);

  if (s > 0) {
    const p = Math.log10(1 + s) / Math.log10(1 + 6000);
    return clamp(p, 0, 1);
  }

  return clamp(toNum(resonancePercent, 0) / 100, 0, 1);
}

export const lerp = (a, b, t) => a + (b - a) * t;

export function hexToRgb(hex) {
  const h = String(hex).replace("#", "").trim();
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
export function rgbToCss({ r, g, b }, a = 1) {
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
}
export function mix(hexA, hexB, t) {
  const A = hexToRgb(hexA), B = hexToRgb(hexB);
  return { r: lerp(A.r, B.r, t), g: lerp(A.g, B.g, t), b: lerp(A.b, B.b, t) };
}
