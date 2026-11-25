/**
 * Цветной план эвакуации по ГОСТ 34428-2018 / ГОСТ Р 12.2.143
 * и цветографике ГОСТ 12.4.026:
 * — фон желтовато-белый;
 * — пути к основным выходам — сплошная зелёная;
 * — к запасным — штриховая зелёная;
 * — средства пожаротушения — красные;
 * — надписи (кроме знаков) — чёрные;
 * — «Вы находитесь здесь», легенда, текстовая инструкция.
 */
import type { EvacuationAnalysis, EvacPosterSpot } from "./types";
import type { Pt } from "../AutoPlan/layout/geometry";

const GREEN = "#00A651";
const GREEN_DARK = "#007A3D";
const RED = "#E30613";
const BLACK = "#1a1a1a";
const BG = "#FFFCE8";
const WALL = "#2a2a2a";
const ROOM_FILL = "#F7F4E8";
const FURN_FILL = "#D4D0C4";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function boundsOf(analysis: EvacuationAnalysis) {
  const pts: Pt[] = [];
  for (const w of analysis.walls) pts.push(w.start, w.end);
  for (const r of analysis.rooms) pts.push(...r.points);
  for (const e of analysis.exits) pts.push(e.point);
  for (const p of analysis.posters) pts.push(p.point);
  if (!pts.length) {
    return { minX: 0, minY: 0, width: 800, height: 600 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const pad = 60;
  return {
    minX: minX - pad,
    minY: minY - pad,
    width: Math.max(maxX - minX + pad * 2, 400),
    height: Math.max(maxY - minY + pad * 2, 300),
  };
}

function polyPath(points: Pt[]) {
  if (!points.length) return "";
  return (
    points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") +
    " Z"
  );
}

function polyline(points: Pt[]) {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

/** Стрелка направления эвакуации */
function arrowHead(from: Pt, to: Pt, color: string) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const size = 18;
  const tip = to;
  const left = {
    x: tip.x - ux * size + uy * size * 0.45,
    y: tip.y - uy * size - ux * size * 0.45,
  };
  const right = {
    x: tip.x - ux * size - uy * size * 0.45,
    y: tip.y - uy * size + ux * size * 0.45,
  };
  return `<polygon points="${tip.x.toFixed(1)},${tip.y.toFixed(1)} ${left.x.toFixed(1)},${left.y.toFixed(1)} ${right.x.toFixed(1)},${right.y.toFixed(1)}" fill="${color}"/>`;
}

function exitSign(p: Pt, primary: boolean) {
  const label = primary ? "ВЫХОД" : "ЗАПАСНЫЙ";
  const w = primary ? 56 : 72;
  return `
    <g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})">
      <rect x="${-w / 2}" y="-14" width="${w}" height="28" rx="3" fill="${GREEN}" stroke="${GREEN_DARK}" stroke-width="2"/>
      <text text-anchor="middle" y="5" fill="#fff" font-size="11" font-family="Arial, sans-serif" font-weight="700">${label}</text>
    </g>`;
}

function youAreHere(p: Pt) {
  return `
    <g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})">
      <circle r="10" fill="${RED}" stroke="#fff" stroke-width="2"/>
      <circle r="4" fill="#fff"/>
      <text text-anchor="middle" y="28" fill="${BLACK}" font-size="11" font-family="Arial, sans-serif" font-weight="700">Вы находитесь здесь</text>
    </g>`;
}

function fireIcon(p: Pt, kind: "extinguisher" | "first-aid") {
  if (kind === "first-aid") {
    return `
      <g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})">
        <rect x="-10" y="-10" width="20" height="20" rx="2" fill="#fff" stroke="${RED}" stroke-width="2"/>
        <rect x="-7" y="-2" width="14" height="4" fill="${RED}"/>
        <rect x="-2" y="-7" width="4" height="14" fill="${RED}"/>
      </g>`;
  }
  return `
    <g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})">
      <rect x="-8" y="-12" width="16" height="22" rx="3" fill="${RED}" stroke="#8B0000" stroke-width="1"/>
      <rect x="-4" y="-16" width="8" height="5" rx="1" fill="#444"/>
    </g>`;
}

function posterMark(p: Pt) {
  return `
    <g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})">
      <rect x="-8" y="-10" width="16" height="20" rx="1" fill="#fff" stroke="${GREEN}" stroke-width="2"/>
      <line x1="-4" y1="-4" x2="4" y2="-4" stroke="${GREEN}" stroke-width="1.5"/>
      <line x1="-4" y1="0" x2="4" y2="0" stroke="${GREEN}" stroke-width="1.5"/>
      <line x1="-4" y1="4" x2="2" y2="4" stroke="${GREEN}" stroke-width="1.5"/>
    </g>`;
}

const TEXT_INSTRUCTIONS = [
  "1. При обнаружении пожара сообщите по тел. 101 / 112 и оповестите окружающих.",
  "2. Отключите электроприборы, закройте окна (не запирайте двери).",
  "3. Выходите по зелёным стрелкам к ближайшему эвакуационному выходу.",
  "4. Не пользуйтесь лифтом. Оказывайте помощь маломобильным.",
  "5. Соберитесь в месте сбора, сообщите о себе ответственному.",
];

/**
 * @param highlightPoster — точка «Вы находитесь здесь» (место размещения этого экземпляра плана)
 */
export function buildEvacuationSvg(
  analysis: EvacuationAnalysis,
  opts?: { highlightPoster?: EvacPosterSpot | null; widthPx?: number },
): string {
  const box = boundsOf(analysis);
  const graphicW = box.width;
  const graphicH = box.height;
  const textW = Math.max(280, graphicW * 0.38);
  const legendH = 110;
  const titleH = 48;
  const totalW = graphicW + textW + 40;
  const totalH = Math.max(graphicH + titleH + legendH + 30, 520);
  const widthPx = opts?.widthPx ?? 1200;
  const heightPx = Math.round((widthPx * totalH) / totalW);

  const youHere =
    opts?.highlightPoster?.point ||
    analysis.posters[0]?.point ||
    null;

  const rooms = analysis.rooms
    .map((r) => {
      const d = polyPath(r.points);
      if (!d) return "";
      return `<path d="${d}" fill="${ROOM_FILL}" stroke="${WALL}" stroke-width="2"/>`;
    })
    .join("\n");

  const walls = analysis.walls
    .map((w) => {
      const t = Math.max(6, w.thickness || 12);
      return `<line x1="${w.start.x.toFixed(1)}" y1="${w.start.y.toFixed(1)}" x2="${w.end.x.toFixed(1)}" y2="${w.end.y.toFixed(1)}" stroke="${WALL}" stroke-width="${t}" stroke-linecap="square"/>`;
    })
    .join("\n");

  const furniture = analysis.furniture
    .filter((f) => !f.kind.includes("evacuation-map"))
    .map((f) => {
      const w = f.width || 40;
      const h = f.depth || 40;
      const rot = f.rotation || 0;
      return `<rect x="${(f.x - w / 2).toFixed(1)}" y="${(f.y - h / 2).toFixed(1)}" width="${w}" height="${h}" rx="2" fill="${FURN_FILL}" stroke="#9a9588" stroke-width="1" transform="rotate(${rot} ${f.x.toFixed(1)} ${f.y.toFixed(1)})"/>`;
    })
    .join("\n");

  const primaryRoutes = analysis.routes
    .filter((r) => r.primary && r.points.length >= 2)
    .map((r) => {
      const pts = r.points;
      const mid = pts[Math.max(0, pts.length - 2)];
      const end = pts[pts.length - 1];
      return `
        <polyline points="${polyline(pts)}" fill="none" stroke="${GREEN}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
        ${arrowHead(mid, end, GREEN)}`;
    })
    .join("\n");

  const secondaryRoutes = analysis.routes
    .filter((r) => !r.primary && r.points.length >= 2)
    .map((r) => {
      const pts = r.points;
      const mid = pts[Math.max(0, pts.length - 2)];
      const end = pts[pts.length - 1];
      return `
        <polyline points="${polyline(pts)}" fill="none" stroke="${GREEN}" stroke-width="8" stroke-dasharray="16 10" stroke-linecap="round" stroke-linejoin="round"/>
        ${arrowHead(mid, end, GREEN)}`;
    })
    .join("\n");

  const exits = analysis.exits.map((e) => exitSign(e.point, e.primary)).join("\n");

  const safety = analysis.safety
    .map((s) => {
      if (s.kind === "poster") return posterMark(s.point);
      return fireIcon(s.point, s.kind);
    })
    .join("\n");

  const roomLabels = analysis.rooms
    .map((r) => {
      if (r.points.length < 3) return "";
      let cx = 0;
      let cy = 0;
      for (const p of r.points) {
        cx += p.x;
        cy += p.y;
      }
      cx /= r.points.length;
      cy /= r.points.length;
      const name = esc((r.name || "").slice(0, 24));
      if (!name) return "";
      return `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" text-anchor="middle" fill="${BLACK}" font-size="12" font-family="Arial, sans-serif">${name}</text>`;
    })
    .join("\n");

  const instructions = TEXT_INSTRUCTIONS.map(
    (line, i) =>
      `<text x="16" y="${36 + i * 22}" fill="${BLACK}" font-size="12" font-family="Arial, sans-serif">${esc(line)}</text>`,
  ).join("\n");

  const legendY = graphicH + titleH + 16;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW.toFixed(0)} ${totalH.toFixed(0)}" width="${widthPx}" height="${heightPx}">
  <rect width="100%" height="100%" fill="${BG}"/>
  <text x="20" y="32" fill="${BLACK}" font-size="22" font-family="Arial, sans-serif" font-weight="700">ПЛАН ЭВАКУАЦИИ</text>
  <text x="20" y="48" fill="${BLACK}" font-size="13" font-family="Arial, sans-serif">${esc(analysis.floorLabel)} · ГОСТ 34428-2018 / ГОСТ 12.4.026</text>

  <g transform="translate(16 ${titleH})">
    <rect x="0" y="0" width="${graphicW}" height="${graphicH}" fill="${BG}" stroke="${BLACK}" stroke-width="1.5"/>
    <svg x="0" y="0" width="${graphicW}" height="${graphicH}" viewBox="${box.minX} ${box.minY} ${box.width} ${box.height}">
      ${rooms}
      ${furniture}
      ${walls}
      ${secondaryRoutes}
      ${primaryRoutes}
      ${exits}
      ${safety}
      ${roomLabels}
      ${youHere ? youAreHere(youHere) : ""}
    </svg>
  </g>

  <g transform="translate(${graphicW + 28} ${titleH})">
    <rect x="0" y="0" width="${textW}" height="${Math.min(graphicH, 320)}" fill="#fff" stroke="${BLACK}" stroke-width="1.5"/>
    <text x="16" y="24" fill="${BLACK}" font-size="14" font-family="Arial, sans-serif" font-weight="700">Действия при пожаре</text>
    ${instructions}
    <text x="16" y="${36 + TEXT_INSTRUCTIONS.length * 22 + 16}" fill="${BLACK}" font-size="11" font-family="Arial, sans-serif">Тел. пожарной охраны: 101 · ЕДДС: 112</text>
  </g>

  <g transform="translate(16 ${legendY})">
    <text x="0" y="0" fill="${BLACK}" font-size="13" font-family="Arial, sans-serif" font-weight="700">Условные обозначения</text>
    <line x1="0" y1="18" x2="48" y2="18" stroke="${GREEN}" stroke-width="6" stroke-linecap="round"/>
    <text x="56" y="22" fill="${BLACK}" font-size="11" font-family="Arial, sans-serif">Путь к основному выходу</text>
    <line x1="240" y1="18" x2="288" y2="18" stroke="${GREEN}" stroke-width="5" stroke-dasharray="10 6" stroke-linecap="round"/>
    <text x="296" y="22" fill="${BLACK}" font-size="11" font-family="Arial, sans-serif">Путь к запасному выходу</text>
    <rect x="0" y="36" width="28" height="16" rx="2" fill="${GREEN}"/>
    <text x="36" y="48" fill="${BLACK}" font-size="11" font-family="Arial, sans-serif">Эвакуационный выход</text>
    <circle cx="200" cy="44" r="7" fill="${RED}"/>
    <text x="214" y="48" fill="${BLACK}" font-size="11" font-family="Arial, sans-serif">Вы находитесь здесь</text>
    <rect x="380" y="34" width="14" height="18" rx="2" fill="${RED}"/>
    <text x="400" y="48" fill="${BLACK}" font-size="11" font-family="Arial, sans-serif">Огнетушитель</text>
    <rect x="520" y="36" width="14" height="14" fill="#fff" stroke="${RED}" stroke-width="2"/>
    <text x="540" y="48" fill="${BLACK}" font-size="11" font-family="Arial, sans-serif">Аптечка</text>
    <rect x="620" y="34" width="12" height="16" fill="#fff" stroke="${GREEN}" stroke-width="2"/>
    <text x="638" y="48" fill="${BLACK}" font-size="11" font-family="Arial, sans-serif">План эвакуации</text>
  </g>

  <text x="20" y="${totalH - 12}" fill="${BLACK}" font-size="10" font-family="Arial, sans-serif">Разработчик: OfficeSync · ${esc(new Date().toLocaleDateString("ru-RU"))}</text>
  <text x="${totalW - 20}" y="${totalH - 12}" text-anchor="end" fill="${BLACK}" font-size="10" font-family="Arial, sans-serif">фотолюминесцентный план · фон желтовато-белый</text>
</svg>`;
}
