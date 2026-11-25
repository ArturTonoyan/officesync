import type { EvacuationAnalysis, GenerateEvacuationResult } from "./types";
import { EVAC_POSTER_KIND } from "./types";
import { buildEvacuationPosterSvg } from "./buildEvacuationPosterSvg";

export type StoredEvacuation = {
  svg: string;
  /** Компактный снимок результата для модалки */
  report: string[];
  analysis: GenerateEvacuationResult["analysis"];
  updatedAt: number;
  /** Запечённый PNG (если влез в quota) — быстрее для 3D */
  png?: string;
};

const evacKey = (floorId: string) => `officesync-evac:${floorId}`;

/** dataURL текстур для 3D-постеров (id мебели → png) */
const posterTextures = new Map<string, string>();
let floorTexture: string | null = null;
/** Последний analysis — для 3D-схемы мешами (UV в pack merge теряются) */
let lastAnalysis: EvacuationAnalysis | null = null;

export function getEvacAnalysis(): EvacuationAnalysis | null {
  return lastAnalysis;
}

export function loadEvacuationCache(
  floorId: string | null | undefined,
): StoredEvacuation | null {
  if (!floorId) return null;
  try {
    const raw = localStorage.getItem(evacKey(floorId));
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredEvacuation;
    if (!data?.svg || !data?.analysis) return null;
    lastAnalysis = data.analysis;
    if (data.png) {
      floorTexture = data.png;
    }
    return data;
  } catch {
    return null;
  }
}

export function saveEvacuationCache(
  floorId: string | null | undefined,
  result: GenerateEvacuationResult,
): Promise<string | null> {
  if (!floorId) return Promise.resolve(null);
  const allFurn = result.plan.floors.flatMap((f) => f.furniture || []);
  const ids = [
    ...result.postersPlaced.map((p) => p.id),
    ...listEvacFurnitureIds(allFurn),
  ];
  const uniqueIds = [...new Set(ids)];
  lastAnalysis = result.analysis;

  const posterItems = allFurn
    .filter((f) => uniqueIds.includes(f.id))
    .map((f) => ({
      id: f.id,
      x: f.x,
      y: f.y,
      rotation: f.rotation || 0,
    }));
  // если только что поставили — тоже в список
  for (const p of result.postersPlaced) {
    if (!posterItems.some((i) => i.id === p.id)) {
      posterItems.push({
        id: p.id,
        x: p.x,
        y: p.y,
        rotation: p.rotation || 0,
      });
    }
  }

  return bakeEvacTextures(result.svg, uniqueIds)
    .then(async (png) => {
      if (result.analysis && posterItems.length) {
        await bakePosterTexturesForItems(result.analysis, posterItems);
      }
      const payload: StoredEvacuation = {
        svg: result.svg,
        report: result.report,
        analysis: result.analysis,
        updatedAt: Date.now(),
        ...(png ? { png } : {}),
      };
      try {
        localStorage.setItem(evacKey(floorId), JSON.stringify(payload));
      } catch {
        try {
          const slim = { ...payload };
          delete slim.png;
          localStorage.setItem(evacKey(floorId), JSON.stringify(slim));
        } catch {
          /* quota */
        }
      }
      return png;
    });
}

export function getEvacPosterTexture(furnitureId?: string | null): string | null {
  if (furnitureId && posterTextures.has(furnitureId)) {
    return posterTextures.get(furnitureId) || null;
  }
  return floorTexture;
}

export function setEvacFloorTexture(dataUrl: string | null) {
  floorTexture = dataUrl;
}

function parseSvgSize(svg: string): { w: number; h: number } {
  const wAttr = svg.match(/\bwidth="([\d.]+)"/i);
  const hAttr = svg.match(/\bheight="([\d.]+)"/i);
  if (wAttr && hAttr) {
    return { w: Number(wAttr[1]) || 1200, h: Number(hAttr[1]) || 800 };
  }
  const vb = svg.match(/viewBox="[^"]*?([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)"/i);
  if (vb) {
    return { w: Number(vb[3]) || 1200, h: Number(vb[4]) || 800 };
  }
  return { w: 1200, h: 800 };
}

/** SVG → PNG dataURL (надёжнее через data: URI) */
export function svgToPngDataUrl(
  svg: string,
  width = 1024,
  height = 1024,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const size = parseSvgSize(svg);
    // гарантируем xmlns
    let src = svg.trim();
    if (!src.includes("xmlns=")) {
      src = src.replace(
        /^<svg\b/i,
        '<svg xmlns="http://www.w3.org/2000/svg"',
      );
    }
    const dataUrl =
      "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("no ctx"));
        return;
      }
      ctx.fillStyle = "#FFFCE8";
      ctx.fillRect(0, 0, width, height);
      const iw = img.naturalWidth || img.width || size.w;
      const ih = img.naturalHeight || img.height || size.h;
      const scale = Math.min(width / iw, height / ih) * 0.96;
      const w = iw * scale;
      const h = ih * scale;
      try {
        ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
      } catch {
        reject(new Error("draw failed"));
        return;
      }
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("svg load failed"));
    img.src = dataUrl;
  });
}

export async function bakeEvacTextures(
  svg: string,
  furnitureIds: string[] = [],
): Promise<string | null> {
  try {
    const dataUrl = await svgToPngDataUrl(svg, 1024, 1024);
    floorTexture = dataUrl;
    for (const id of furnitureIds) {
      posterTextures.set(id, dataUrl);
    }
    return dataUrl;
  } catch {
    return null;
  }
}

export function bindEvacTextureToFurnitureIds(ids: string[]) {
  if (!floorTexture) return;
  for (const id of ids) posterTextures.set(id, floorTexture);
}

export function listEvacFurnitureIds(
  furniture: { id: string; kind: string }[] | undefined,
): string[] {
  return (furniture || [])
    .filter((f) => String(f.kind) === EVAC_POSTER_KIND)
    .map((f) => f.id);
}

type PosterItem = { id: string; x: number; y: number; rotation?: number };

/** PNG для каждого постера: один SVG-план, своя красная точка */
export async function bakePosterTexturesForItems(
  analysis: EvacuationAnalysis,
  items: PosterItem[],
): Promise<boolean> {
  if (!items.length) return false;
  let ok = false;
  await Promise.all(
    items.map(async (item) => {
      try {
        const rad = ((item.rotation || 0) * Math.PI) / 180;
        const youAreHere = {
          x: item.x + Math.sin(rad) * 28,
          y: item.y + Math.cos(rad) * 28,
        };
        const svg = buildEvacuationPosterSvg(analysis, youAreHere, 1024);
        const png = await svgToPngDataUrl(svg, 1024, 1024);
        posterTextures.set(item.id, png);
        if (!floorTexture) floorTexture = png;
        ok = true;
      } catch {
        /* skip one */
      }
    }),
  );
  return ok;
}

/** Подготовить текстуры этажа перед входом в 3D */
export async function ensureEvacTexturesForFloor(
  floorId: string | null | undefined,
  furnitureIds: string[],
  furnitureItems?: PosterItem[],
): Promise<boolean> {
  const cached = loadEvacuationCache(floorId);
  const items =
    furnitureItems?.filter((f) => furnitureIds.includes(f.id)) ||
    furnitureIds.map((id) => ({ id, x: 0, y: 0 }));

  if (cached?.analysis && items.length) {
    const baked = await bakePosterTexturesForItems(cached.analysis, items);
    if (baked) return true;
  }

  if (!cached?.svg) {
    if (floorTexture && furnitureIds.length) {
      bindEvacTextureToFurnitureIds(furnitureIds);
      return true;
    }
    return false;
  }
  if (cached.png) {
    floorTexture = cached.png;
    bindEvacTextureToFurnitureIds(furnitureIds);
    return true;
  }
  const png = await bakeEvacTextures(cached.svg, furnitureIds);
  if (png && floorId) {
    try {
      localStorage.setItem(
        evacKey(floorId),
        JSON.stringify({ ...cached, png }),
      );
    } catch {
      /* ignore */
    }
  }
  return Boolean(png);
}