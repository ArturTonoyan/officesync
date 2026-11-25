/**
 * Квадратный SVG для 3D-плаката на стене (как реальный план эвакуации).
 */
import type { EvacuationAnalysis } from "./types";
import type { Pt } from "../AutoPlan/layout/geometry";

const GREEN = "#00A651";
const GREEN_DARK = "#007A3D";
const RED = "#E30613";
const BLACK = "#1a1a1a";
const BG = "#FFFCE8";
const WALL = "#2a2a2a";
const ROOM_FILL = "#F7F4E8";
const FURN_FILL = "#D4D0C4";
const HEADER = "#0B6B38";

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
  if (!pts.length) return { minX: 0, minY: 0, width: 800, height: 600 };
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const pad = 40;
  return {
    minX: minX - pad,
    minY: minY - pad,
    width: Math.max(maxX - minX + pad * 2, 200),
    height: Math.max(maxY - minY + pad * 2, 200),
  };
}

function polyPath(points: Pt[]) {
  if (!points.length) return "";
  return (
    points
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
      )
      .join(" ") + " Z"
  );
}

function polyline(points: Pt[]) {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

function arrowHead(from: Pt, to: Pt) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const size = 22;
  const tip = to;
  const left = {
    x: tip.x - ux * size + uy * size * 0.45,
    y: tip.y - uy * size - ux * size * 0.45,
  };
  const right = {
    x: tip.x - ux * size - uy * size * 0.45,
    y: tip.y - uy * size + ux * size * 0.45,
  };
  return `<polygon points="${tip.x.toFixed(1)},${tip.y.toFixed(1)} ${left.x.toFixed(1)},${left.y.toFixed(1)} ${right.x.toFixed(1)},${right.y.toFixed(1)}" fill="${GREEN}"/>`;
}

/**
 * Квадратный план для текстуры постера.
 * @param youAreHere — координаты «вы здесь» (позиция этого экземпляра)
 */
export function buildEvacuationPosterSvg(
  analysis: EvacuationAnalysis,
  youAreHere: Pt | null,
  sizePx = 1024,
): string {
  const S = 1000;
  const headerH = 90;
  const footerH = 70;
  const margin = 28;
  const mapTop = headerH + margin;
  const mapSize = S - headerH - footerH - margin * 2;
  const box = boundsOf(analysis);
  const scale = Math.min(mapSize / box.width, mapSize / box.height) * 0.94;
  const ox = margin + (mapSize - box.width * scale) / 2;
  const oy = mapTop + (mapSize - box.height * scale) / 2;

  const mapPt = (p: Pt) => ({
    x: ox + (p.x - box.minX) * scale,
    y: oy + (p.y - box.minY) * scale,
  });

  const rooms = analysis.rooms
    .map((r) => {
      if (!r.points?.length) return "";
      const pts = r.points.map(mapPt);
      return `<path d="${polyPath(pts)}" fill="${ROOM_FILL}" stroke="${WALL}" stroke-width="2.5"/>`;
    })
    .join("\n");

  const walls = analysis.walls
    .map((w) => {
      const a = mapPt(w.start);
      const b = mapPt(w.end);
      const t = Math.max(3.5, ((w.thickness || 12) * scale) / 4);
      return `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="${WALL}" stroke-width="${t.toFixed(1)}" stroke-linecap="square"/>`;
    })
    .join("\n");

  const furniture = (analysis.furniture || [])
    .filter((f) => !String(f.kind || "").includes("evacuation-map"))
    .map((f) => {
      const c = mapPt({ x: f.x, y: f.y });
      const w = Math.max(4, (f.width || 40) * scale);
      const h = Math.max(4, (f.depth || 40) * scale);
      const rot = f.rotation || 0;
      return `<rect x="${(c.x - w / 2).toFixed(1)}" y="${(c.y - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" fill="${FURN_FILL}" stroke="#9a9588" stroke-width="0.8" transform="rotate(${rot} ${c.x.toFixed(1)} ${c.y.toFixed(1)})"/>`;
    })
    .join("\n");

  const routes = (analysis.routes || [])
    .filter((r) => r.points?.length >= 2)
    .map((r) => {
      const pts = r.points.map(mapPt);
      const dash = r.primary ? "" : ` stroke-dasharray="14 9"`;
      const sw = r.primary ? 7 : 5.5;
      const mid = pts[Math.max(0, pts.length - 2)];
      const end = pts[pts.length - 1];
      return `
        <polyline points="${polyline(pts)}" fill="none" stroke="${GREEN}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${dash}/>
        ${arrowHead(mid, end)}`;
    })
    .join("\n");

  const exits = (analysis.exits || [])
    .map((e) => {
      const p = mapPt(e.point);
      const label = e.primary ? "ВЫХОД" : "ЗАПАСНЫЙ";
      const w = e.primary ? 52 : 68;
      return `
        <g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})">
          <rect x="${-w / 2}" y="-12" width="${w}" height="24" rx="3" fill="${GREEN}" stroke="${GREEN_DARK}" stroke-width="1.5"/>
          <text text-anchor="middle" y="5" fill="#fff" font-size="10" font-family="Arial, sans-serif" font-weight="700">${label}</text>
        </g>`;
    })
    .join("\n");

  const labels = (analysis.rooms || [])
    .map((r) => {
      if (!r.points?.length || !r.name) return "";
      let cx = 0,
        cy = 0;
      for (const p of r.points) {
        cx += p.x;
        cy += p.y;
      }
      cx /= r.points.length;
      cy /= r.points.length;
      const p = mapPt({ x: cx, y: cy });
      return `<text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" text-anchor="middle" fill="${BLACK}" font-size="11" font-family="Arial, sans-serif">${esc(r.name.slice(0, 22))}</text>`;
    })
    .join("\n");

  let hereMark = "";
  if (youAreHere) {
    const p = mapPt(youAreHere);
    hereMark = `
      <g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})">
        <circle r="11" fill="${RED}" stroke="#fff" stroke-width="2.5"/>
        <circle r="4" fill="#fff"/>
      </g>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${sizePx}" height="${sizePx}">
  <rect width="${S}" height="${S}" fill="${BG}"/>
  <rect width="${S}" height="${headerH}" fill="${HEADER}"/>
  <text x="${S / 2}" y="38" text-anchor="middle" fill="#fff" font-size="28" font-family="Arial, sans-serif" font-weight="700">ПЛАН ЭВАКУАЦИИ</text>
  <text x="${S / 2}" y="68" text-anchor="middle" fill="#d4f5e0" font-size="14" font-family="Arial, sans-serif">${esc(analysis.floorLabel || "")} · ГОСТ 34428</text>

  <rect x="${margin}" y="${mapTop}" width="${mapSize}" height="${mapSize}" fill="${BG}" stroke="${BLACK}" stroke-width="2"/>
  ${rooms}
  ${furniture}
  ${walls}
  ${routes}
  ${exits}
  ${labels}
  ${hereMark}

  <rect x="0" y="${S - footerH}" width="${S}" height="${footerH}" fill="#f5f2e4" stroke="${BLACK}" stroke-width="1"/>
  <circle cx="40" cy="${S - footerH / 2}" r="8" fill="${RED}" stroke="#fff" stroke-width="1.5"/>
  <text x="56" y="${S - footerH / 2 + 5}" fill="${BLACK}" font-size="13" font-family="Arial, sans-serif">Вы находитесь здесь</text>
  <line x1="280" y1="${S - footerH / 2}" x2="320" y2="${S - footerH / 2}" stroke="${GREEN}" stroke-width="5" stroke-linecap="round"/>
  <text x="328" y="${S - footerH / 2 + 5}" fill="${BLACK}" font-size="13" font-family="Arial, sans-serif">Путь к выходу</text>
  <rect x="520" y="${S - footerH / 2 - 8}" width="36" height="16" rx="2" fill="${GREEN}"/>
  <text x="564" y="${S - footerH / 2 + 5}" fill="${BLACK}" font-size="13" font-family="Arial, sans-serif">Выход</text>
  <text x="${S - 24}" y="${S - footerH / 2 + 5}" text-anchor="end" fill="#666" font-size="11" font-family="Arial, sans-serif">тел. 101 / 112</text>
</svg>`;
}
