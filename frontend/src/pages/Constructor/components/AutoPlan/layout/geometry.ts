export type Pt = { x: number; y: number };

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function polygonAreaCm2(points: Pt[]): number {
  if (!points?.length || points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

export function polygonBounds(points: Pt[]): Rect | null {
  if (!points?.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function pointInPolygon(x: number, y: number, points: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function rotatedBounds(
  cx: number,
  cy: number,
  width: number,
  depth: number,
  rotation = 0,
): Rect {
  const rad = ((rotation || 0) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const w = width * cos + depth * sin;
  const h = width * sin + depth * cos;
  return { x: cx - w / 2, y: cy - h / 2, width: w, height: h };
}

export function rectsOverlap(a: Rect, b: Rect, pad = 0): boolean {
  return !(
    a.x + a.width + pad <= b.x ||
    b.x + b.width + pad <= a.x ||
    a.y + a.height + pad <= b.y ||
    b.y + b.height + pad <= a.y
  );
}

/** Все углы прямоугольника внутри полигона */
export function rectInsidePolygon(rect: Rect, points: Pt[], inset = 0): boolean {
  const samples: Pt[] = [
    { x: rect.x + inset, y: rect.y + inset },
    { x: rect.x + rect.width - inset, y: rect.y + inset },
    { x: rect.x + inset, y: rect.y + rect.height - inset },
    { x: rect.x + rect.width - inset, y: rect.y + rect.height - inset },
    { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
  ];
  return samples.every((p) => pointInPolygon(p.x, p.y, points));
}

export function insetBounds(b: Rect, inset: number): Rect | null {
  const width = b.width - inset * 2;
  const height = b.height - inset * 2;
  if (width < 40 || height < 40) return null;
  return { x: b.x + inset, y: b.y + inset, width, height };
}
