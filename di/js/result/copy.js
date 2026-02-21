// /di/js/result/copy.js
import { rgbToCss, mix } from "./utils.js";

const COLORS = Object.freeze({
  neonCyan:   "#00F6FF",
  neonViolet: "#A855FF",
  neonPink:   "#FF2FEA",
  neonLime:   "#B8FF3D",
  neonGold:   "#FFE85A",
  white:      "#FFFFFF",
});

// Score -> ARU hue (蛍光帯域)
export function aruColorByScoreP(p) {
  if (p < 0.22) return rgbToCss(mix(COLORS.neonCyan,   COLORS.neonViolet, p / 0.22), 0.995);
  if (p < 0.48) return rgbToCss(mix(COLORS.neonViolet, COLORS.neonPink,  (p - 0.22) / 0.26), 0.995);
  if (p < 0.72) return rgbToCss(mix(COLORS.neonPink,   COLORS.neonGold,  (p - 0.48) / 0.24), 0.995);
  if (p < 0.90) return rgbToCss(mix(COLORS.neonGold,   COLORS.neonLime,  (p - 0.72) / 0.18), 0.995);
  return rgbToCss(mix(COLORS.neonLime, COLORS.white, (p - 0.90) / 0.10), 0.999);
}

export function lineBy(resPercent, nameOrNull) {
  const name = nameOrNull;
  if (resPercent >= 100) {
    return name
      ? `……ARU、完成。\n${name}──君の想いは、瞳に宿った。`
      : `……ARU、完成。\n君の想いは、瞳に宿った。`;
  }
  if (resPercent >= 80) {
    return name
      ? `${name}。\n波形が綺麗。あと少しで“完成域”。`
      : `波形が綺麗。\nあと少しで“完成域”。`;
  }
  if (resPercent >= 50) {
    return name
      ? `${name}。\n揺らぎはある。だから、伸びる。`
      : `揺らぎはある。\nだから、伸びる。`;
  }
  return `共鳴は消えてない。\nDiDiDi…もう一回、いこ？`;
}
