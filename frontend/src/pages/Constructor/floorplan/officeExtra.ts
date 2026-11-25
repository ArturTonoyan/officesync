import type { PackItem } from "@jbaysolutions/floorplan-react";

/** Дополнительная офисная мебель (2D-символы в стиле JBay). */

const round = (n: number) => Math.round(n * 10) / 10;

const rect = (
  cls: string,
  x: number,
  y: number,
  w: number,
  h: number,
  rx = 0,
) =>
  `<rect class="${cls}" x="${round(x)}" y="${round(y)}" width="${round(Math.max(w, 0.1))}" height="${round(Math.max(h, 0.1))}" rx="${round(Math.max(0, Math.min(rx, w / 2, h / 2)))}"/>`;

const box = (cls: string, cx: number, cy: number, w: number, h: number, rx = 0) =>
  rect(cls, cx - w / 2, cy - h / 2, w, h, rx);

const circle = (cls: string, cx: number, cy: number, r: number) =>
  `<circle class="${cls}" cx="${round(cx)}" cy="${round(cy)}" r="${round(Math.max(r, 0.1))}"/>`;

const ellipse = (
  cls: string,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
) =>
  `<ellipse class="${cls}" cx="${round(cx)}" cy="${round(cy)}" rx="${round(Math.max(rx, 0.1))}" ry="${round(Math.max(ry, 0.1))}"/>`;

const g = (x: number, y: number, rot: number, inner: string) =>
  `<g transform="translate(${round(x)} ${round(y)}) rotate(${round(rot)})">${inner}</g>`;

const monitor = (x: number, y: number, w = 52) =>
  g(
    x,
    y,
    0,
    box("fp-f2", 0, -5, w * 0.28, 7, 2) + box("fp-tv", 0, 0, w, 3.2, 1.5),
  );

const chairTop = (x: number, y: number, rot = 0, size = 36) =>
  g(
    x,
    y,
    rot,
    circle("fp-fl", 0, 0, size * 0.48) + box("fp-f", 0, 2, size * 0.72, size * 0.7, size * 0.14),
  );

export const officeExtraItems: PackItem[] = [
  // —— Столы ——
  {
    kind: "office/compact-desk",
    label: "Compact desk",
    category: "Desks",
    width: 120,
    depth: 60,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      monitor(0, -d / 2 + 10, Math.min(48, w * 0.42)) +
      box("fp-fl", -6, 4, 34, 11, 2),
  },
  {
    kind: "office/executive-desk",
    label: "Executive desk",
    category: "Desks",
    width: 200,
    depth: 100,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      box("fp-f2", -w / 2 + 18, 0, 14, d * 0.7, 2) +
      box("fp-f2", w / 2 - 18, 0, 14, d * 0.7, 2) +
      monitor(0, -d / 2 + 14, 64) +
      box("fp-fl", -8, 8, 44, 14, 2) +
      ellipse("fp-fl", 28, 8, 4, 6),
  },
  {
    kind: "office/facing-desks",
    label: "Facing desks for 2",
    category: "Desks",
    width: 160,
    depth: 160,
    symbol: (w, d) =>
      box("fp-f", 0, -d * 0.28, w, d * 0.36, 3) +
      box("fp-f", 0, d * 0.28, w, d * 0.36, 3) +
      box("fp-f2", 0, 0, w * 0.92, 10, 2) +
      monitor(0, -d * 0.42, 50) +
      monitor(0, d * 0.42, 50) +
      chairTop(0, -d * 0.02 - d * 0.42 - 28, 180) +
      chairTop(0, d * 0.02 + d * 0.42 + 28, 0),
  },
  {
    kind: "office/wall-desk",
    label: "Wall-mounted desk",
    category: "Desks",
    width: 180,
    depth: 50,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      box("fp-f2", 0, -d / 2 + 3, w, 5, 1) +
      monitor(-40, -2, 44) +
      monitor(40, -2, 44) +
      box("fp-fl", -40, 10, 28, 8, 2) +
      box("fp-fl", 40, 10, 28, 8, 2),
  },
  {
    kind: "office/collab-island",
    label: "Collaboration island",
    category: "Desks",
    width: 240,
    depth: 120,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 6) +
      box("fp-f2", 0, 0, w * 0.55, d * 0.45, 4) +
      chairTop(-w * 0.32, -d * 0.42, 180, 32) +
      chairTop(0, -d * 0.42, 180, 32) +
      chairTop(w * 0.32, -d * 0.42, 180, 32) +
      chairTop(-w * 0.32, d * 0.42, 0, 32) +
      chairTop(0, d * 0.42, 0, 32) +
      chairTop(w * 0.32, d * 0.42, 0, 32),
  },

  // —— Перегородки ——
  {
    kind: "office/cubicle-low",
    label: "Low cubicle wall",
    category: "Screens & dividers",
    width: 140,
    depth: 18,
    symbol: (w, d) =>
      box("fp-f2", 0, 0, w, d, 2) + box("fp-fa", 0, 0, w * 0.92, d * 0.55, 1),
  },
  {
    kind: "office/cubicle-tall",
    label: "Tall cubicle wall",
    category: "Screens & dividers",
    width: 140,
    depth: 28,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      box("fp-fa", 0, 0, w * 0.9, d * 0.5, 1) +
      rect("fp-fl", -w / 2 + 6, -d / 2 + 4, w - 12, 3, 1),
  },
  {
    kind: "office/corner-screen",
    label: "L-shaped privacy screen",
    category: "Screens & dividers",
    width: 140,
    depth: 140,
    symbol: (w, d) =>
      box("fp-f2", -w / 2 + 10, 0, 20, d, 3) +
      box("fp-f2", 0, d / 2 - 10, w, 20, 3) +
      box("fp-fa", -w / 2 + 10, 0, 10, d * 0.85, 2) +
      box("fp-fa", 0, d / 2 - 10, w * 0.85, 10, 2),
  },

  // —— Стулья / мягкая мебель ——
  {
    kind: "office/pouf",
    label: "Pouf",
    category: "Chairs",
    width: 50,
    depth: 50,
    symbol: (_w, _d) =>
      circle("fp-fl", 0, 0, 24) + circle("fp-f", 0, 0, 20),
  },
  {
    kind: "office/bench-seat",
    label: "Bench seat",
    category: "Chairs",
    width: 140,
    depth: 48,
    symbol: (w, d) =>
      box("fp-f", 0, 4, w, d * 0.72, 6) +
      box("fp-f2", 0, -d / 2 + 8, w * 0.96, 12, 4),
  },
  {
    kind: "office/sofa-2",
    label: "2-seat sofa",
    category: "Chairs",
    width: 160,
    depth: 80,
    symbol: (w, d) =>
      box("fp-f", 0, 4, w * 0.92, d * 0.7, 8) +
      box("fp-f2", 0, -d / 2 + 12, w * 0.92, 18, 6) +
      box("fp-f2", -w / 2 + 10, 2, 16, d * 0.72, 5) +
      box("fp-f2", w / 2 - 10, 2, 16, d * 0.72, 5) +
      box("fp-fa", -w * 0.2, 6, w * 0.28, d * 0.4, 4) +
      box("fp-fa", w * 0.2, 6, w * 0.28, d * 0.4, 4),
  },
  {
    kind: "office/sofa-3",
    label: "3-seat sofa",
    category: "Chairs",
    width: 220,
    depth: 85,
    symbol: (w, d) =>
      box("fp-f", 0, 4, w * 0.94, d * 0.7, 8) +
      box("fp-f2", 0, -d / 2 + 12, w * 0.94, 18, 6) +
      box("fp-f2", -w / 2 + 11, 2, 18, d * 0.72, 5) +
      box("fp-f2", w / 2 - 11, 2, 18, d * 0.72, 5) +
      [-0.3, 0, 0.3]
        .map((t) => box("fp-fa", w * t, 6, w * 0.22, d * 0.4, 4))
        .join(""),
  },
  {
    kind: "office/ottoman",
    label: "Ottoman",
    category: "Chairs",
    width: 70,
    depth: 50,
    symbol: (w, d) => box("fp-f", 0, 0, w, d, 10) + box("fp-fa", 0, 0, w * 0.7, d * 0.55, 6),
  },

  // —— Переговорные ——
  {
    kind: "office/flipchart",
    label: "Flip chart",
    category: "Meeting",
    width: 70,
    depth: 55,
    symbol: (w, d) =>
      box("fp-fl", 0, d / 2 - 6, w * 0.7, 8, 2) +
      box("fp-f", 0, -4, w * 0.85, d * 0.75, 3) +
      rect("fp-fl", -w * 0.28, -d * 0.28, w * 0.56, 2, 0) +
      rect("fp-fl", -w * 0.28, -d * 0.12, w * 0.4, 2, 0),
  },
  {
    kind: "office/lectern",
    label: "Lectern",
    category: "Meeting",
    width: 60,
    depth: 50,
    symbol: (w, d) =>
      box("fp-f", 0, 4, w * 0.7, d * 0.55, 2) +
      box("fp-f2", 0, -d / 2 + 10, w, 14, 2) +
      box("fp-fl", 0, -d / 2 + 10, w * 0.7, 6, 1),
  },
  {
    kind: "office/side-table",
    label: "Side table",
    category: "Meeting",
    width: 55,
    depth: 55,
    symbol: (_w, _d) =>
      circle("fp-fl", 0, 0, 26) + circle("fp-f", 0, 0, 22),
  },
  {
    kind: "office/lounge-set",
    label: "Lounge seating set",
    category: "Meeting",
    width: 220,
    depth: 160,
    symbol: (w, d) =>
      box("fp-f", 0, -d * 0.28, w * 0.85, d * 0.36, 8) +
      box("fp-f2", 0, -d * 0.42, w * 0.85, 14, 5) +
      circle("fp-f", 0, d * 0.22, 28) +
      chairTop(-w * 0.32, d * 0.28, -30, 34) +
      chairTop(w * 0.32, d * 0.28, 30, 34),
  },
  {
    kind: "office/tv-stand",
    label: "TV on stand",
    category: "Meeting",
    width: 160,
    depth: 50,
    symbol: (w, d) =>
      box("fp-f", 0, d / 2 - 10, w * 0.7, 16, 2) +
      box("fp-tv", 0, -6, w * 0.92, d * 0.55, 2) +
      box("fp-f2", 0, -6, w * 0.78, d * 0.4, 1),
  },

  // —— Зоны фокуса ——
  {
    kind: "office/waiting-bench",
    label: "Waiting bench",
    category: "Focus & lounge",
    width: 180,
    depth: 55,
    symbol: (w, d) =>
      box("fp-f", 0, 6, w, d * 0.65, 6) +
      box("fp-f2", 0, -d / 2 + 10, w, 14, 4) +
      box("fp-f2", -w / 2 + 8, 2, 12, d * 0.7, 3) +
      box("fp-f2", w / 2 - 8, 2, 12, d * 0.7, 3),
  },
  {
    kind: "office/privacy-chair",
    label: "High-back privacy chair",
    category: "Focus & lounge",
    width: 90,
    depth: 90,
    symbol: (w, d) =>
      box("fp-f2", 0, -d * 0.08, w * 0.85, d * 0.85, w * 0.4) +
      box("fp-f", 0, d * 0.12, w * 0.55, d * 0.45, 10) +
      box("fp-fa", 0, -d * 0.22, w * 0.55, 16, 6),
  },
  {
    kind: "office/daybed",
    label: "Rest daybed",
    category: "Focus & lounge",
    width: 200,
    depth: 90,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 8) +
      box("fp-fa", -w * 0.15, 0, w * 0.55, d * 0.7, 6) +
      box("fp-f2", w / 2 - 22, 0, 28, d * 0.85, 6),
  },
  {
    kind: "office/focus-booth",
    label: "Focus booth",
    category: "Focus & lounge",
    width: 120,
    depth: 120,
    symbol: (w, d) =>
      box("fp-f2", 0, 0, w, d, 10) +
      box("fp-f", 0, d * 0.08, w * 0.55, d * 0.45, 4) +
      chairTop(0, -d * 0.18, 180, 34) +
      box("fp-fl", 0, d / 2 - 8, w * 0.7, 10, 2),
  },

  // —— Хранение ——
  {
    kind: "office/tall-cabinet",
    label: "Tall cabinet",
    category: "Storage",
    width: 80,
    depth: 45,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      rect("fp-fl", 0, -d / 2 + 4, 1.5, d - 8, 0) +
      circle("fp-f2", -w * 0.18, 0, 2.5) +
      circle("fp-f2", w * 0.18, 0, 2.5),
  },
  {
    kind: "office/credenza",
    label: "Credenza",
    category: "Storage",
    width: 180,
    depth: 45,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      rect("fp-fl", -w / 6, -d / 2 + 4, 1.2, d - 8, 0) +
      rect("fp-fl", w / 6, -d / 2 + 4, 1.2, d - 8, 0) +
      box("fp-f2", 0, 0, w * 0.9, d * 0.35, 2),
  },
  {
    kind: "office/bookshelf",
    label: "Bookshelf",
    category: "Storage",
    width: 100,
    depth: 40,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      [-0.28, 0, 0.28]
        .map((t) => rect("fp-fl", -w / 2 + 6, d * t - 1, w - 12, 2, 0))
        .join("") +
      box("fp-f2", -w * 0.22, -d * 0.15, 18, 8, 1) +
      box("fp-f2", w * 0.18, d * 0.12, 22, 8, 1),
  },
  {
    kind: "office/coat-rack",
    label: "Coat rack",
    category: "Storage",
    width: 60,
    depth: 60,
    symbol: (_w, _d) =>
      circle("fp-fl", 0, 0, 8) +
      circle("fp-f2", 0, 0, 4) +
      [0, 60, 120, 180, 240, 300]
        .map(
          (deg) =>
            g(
              0,
              0,
              deg,
              rect("fp-fl", 4, -1.2, 18, 2.4, 1) + circle("fp-f2", 24, 0, 3),
            ),
        )
        .join(""),
  },
  {
    kind: "office/recycling-station",
    label: "Recycling station",
    category: "Storage",
    width: 110,
    depth: 45,
    symbol: (w, d) =>
      [-0.33, 0, 0.33]
        .map(
          (t, i) =>
            box(i === 1 ? "fp-f2" : "fp-f", w * t, 0, w * 0.28, d, 4) +
            box("fp-fl", w * t, -d * 0.15, w * 0.16, 6, 2),
        )
        .join(""),
  },

  // —— Оборудование ——
  {
    kind: "office/trash-bin",
    label: "Trash bin",
    category: "Equipment",
    width: 35,
    depth: 35,
    symbol: (_w, _d) =>
      box("fp-f2", 0, 2, 28, 26, 4) + box("fp-f", 0, -12, 32, 6, 2),
  },
  {
    kind: "office/shredder",
    label: "Paper shredder",
    category: "Equipment",
    width: 45,
    depth: 40,
    symbol: (w, d) =>
      box("fp-f", 0, 2, w, d * 0.85, 3) +
      box("fp-f2", 0, -d * 0.28, w * 0.85, 8, 2) +
      rect("fp-fl", -w * 0.28, -d * 0.28, w * 0.56, 2, 0),
  },
  {
    kind: "office/mobile-tv",
    label: "Mobile TV cart",
    category: "Equipment",
    width: 120,
    depth: 55,
    symbol: (w, d) =>
      box("fp-fl", 0, d / 2 - 8, w * 0.55, 10, 2) +
      circle("fp-f2", -w * 0.2, d / 2 - 4, 4) +
      circle("fp-f2", w * 0.2, d / 2 - 4, 4) +
      box("fp-tv", 0, -8, w * 0.9, d * 0.55, 2) +
      box("fp-f2", 0, -8, w * 0.75, d * 0.4, 1),
  },
  {
    kind: "office/charging-locker",
    label: "Charging lockers",
    category: "Equipment",
    width: 100,
    depth: 40,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      [-0.3, -0.1, 0.1, 0.3]
        .map((t) => box("fp-f2", w * t, 0, w * 0.16, d * 0.7, 2))
        .join(""),
  },
  {
    kind: "office/vending",
    label: "Vending machine",
    category: "Equipment",
    width: 80,
    depth: 70,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      box("fp-f2", 0, -d * 0.08, w * 0.72, d * 0.55, 2) +
      box("fp-tv", -w * 0.18, d * 0.28, 12, 8, 1) +
      box("fp-fl", w * 0.18, d * 0.28, 18, 8, 2),
  },
  {
    kind: "office/plotter",
    label: "Large-format plotter",
    category: "Equipment",
    width: 160,
    depth: 70,
    symbol: (w, d) =>
      box("fp-f", 0, 4, w, d * 0.7, 3) +
      box("fp-f2", 0, -d * 0.22, w * 0.92, 14, 2) +
      circle("fp-fl", -w * 0.35, d * 0.32, 5) +
      circle("fp-fl", w * 0.35, d * 0.32, 5),
  },
  {
    kind: "office/fire-extinguisher",
    label: "Fire extinguisher",
    category: "Equipment",
    width: 28,
    depth: 28,
    symbol: (_w, _d) =>
      circle("fp-f", 0, 2, 10) +
      box("fp-fire", 0, 2, 12, 16, 3) +
      box("fp-fl", 0, -10, 8, 4, 1),
  },
  {
    kind: "office/first-aid",
    label: "First aid cabinet",
    category: "Equipment",
    width: 40,
    depth: 18,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      box("fp-fire", 0, 0, 10, 3, 1) +
      box("fp-fire", 0, 0, 3, 10, 1),
  },
  {
    kind: "office/exit-sign",
    label: "Exit sign",
    category: "Equipment",
    width: 48,
    depth: 8,
    symbol: (w, d) => {
      const bw = Math.max(w, 28);
      const bh = Math.max(d * 5, 12);
      return (
        `<rect x="${round(-bw / 2)}" y="${round(-bh / 2)}" width="${round(bw)}" height="${round(bh)}" rx="1" fill="#00A651" stroke="#007A3D" stroke-width="1"/>` +
        `<text x="0" y="${round(bh * 0.18)}" text-anchor="middle" font-size="7" font-weight="700" fill="#fff" font-family="Arial,sans-serif">ВЫХОД</text>`
      );
    },
  },
  {
    kind: "office/exit-arrow",
    label: "Exit direction sign",
    category: "Equipment",
    width: 40,
    depth: 8,
    symbol: (w, d) => {
      const bw = Math.max(w, 22);
      const bh = Math.max(d * 4, 10);
      return (
        `<rect x="${round(-bw / 2)}" y="${round(-bh / 2)}" width="${round(bw)}" height="${round(bh)}" rx="1" fill="#00A651" stroke="#007A3D" stroke-width="1"/>` +
        `<polygon points="${round(-bw * 0.28)},0 ${round(bw * 0.05)},${round(-bh * 0.28)} ${round(bw * 0.05)},${round(-bh * 0.1)} ${round(bw * 0.32)},${round(-bh * 0.1)} ${round(bw * 0.32)},${round(bh * 0.1)} ${round(bw * 0.05)},${round(bh * 0.1)} ${round(bw * 0.05)},${round(bh * 0.28)}" fill="#fff"/>`
      );
    },
  },
  {
    kind: "office/fire-sign",
    label: "Fire extinguisher sign",
    category: "Equipment",
    width: 22,
    depth: 6,
    symbol: (w, d) => {
      const s = Math.max(w, 16);
      return (
        `<rect x="${round(-s / 2)}" y="${round(-s / 2)}" width="${round(s)}" height="${round(s)}" rx="1" fill="#E30613" stroke="#9a0410" stroke-width="1"/>` +
        `<ellipse cx="0" cy="${round(s * 0.08)}" rx="${round(s * 0.18)}" ry="${round(s * 0.28)}" fill="#fff"/>` +
        `<rect x="${round(-s * 0.06)}" y="${round(-s * 0.32)}" width="${round(s * 0.12)}" height="${round(s * 0.14)}" fill="#fff"/>`
      );
    },
  },
  {
    kind: "office/wall-clock",
    label: "Wall clock",
    category: "Equipment",
    width: 40,
    depth: 40,
    symbol: (_w, _d) =>
      circle("fp-fl", 0, 0, 18) +
      circle("fp-f", 0, 0, 15) +
      rect("fp-tv", -1, -10, 2, 10, 0) +
      rect("fp-tv", -1, -1, 8, 2, 0),
  },

  // —— Растения ——
  {
    kind: "office/round-planter",
    label: "Round planter",
    category: "Plants",
    width: 70,
    depth: 70,
    symbol: (_w, _d) =>
      circle("fp-f2", 0, 0, 28) +
      circle("fp-soil", 0, 0, 22) +
      g(0, 0, 0, ellipse("fp-leaf2", 0, -12, 5, 12)) +
      g(0, 0, 120, ellipse("fp-leaf", 0, -14, 6, 14)) +
      g(0, 0, 240, ellipse("fp-leaf", 0, -13, 5.5, 13)),
  },
  {
    kind: "office/plant-shelf",
    label: "Plant shelf",
    category: "Plants",
    width: 120,
    depth: 40,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      [-0.32, 0, 0.32]
        .map(
          (t) =>
            circle("fp-soil", w * t, 0, 10) +
            g(w * t, 0, 20, ellipse("fp-leaf2", 0, -8, 4, 9)),
        )
        .join(""),
  },
  {
    kind: "office/floor-vase",
    label: "Floor vase plant",
    category: "Plants",
    width: 45,
    depth: 45,
    symbol: (_w, _d) =>
      ellipse("fp-f2", 0, 8, 12, 10) +
      g(0, -2, 0, ellipse("fp-leaf", 0, -14, 7, 16)) +
      g(0, -2, 70, ellipse("fp-leaf2", 0, -12, 6, 14)) +
      g(0, -2, -70, ellipse("fp-leaf", 0, -13, 6, 15)),
  },

  // —— Ещё столы ——
  {
    kind: "office/desk-triple-monitor",
    label: "Desk with triple monitors",
    category: "Desks",
    width: 180,
    depth: 80,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      monitor(-48, -d / 2 + 12, 40) +
      monitor(0, -d / 2 + 12, 44) +
      monitor(48, -d / 2 + 12, 40) +
      box("fp-fl", -8, 6, 40, 12, 2) +
      ellipse("fp-fl", 26, 6, 3.5, 5),
  },
  {
    kind: "office/desk-peninsula",
    label: "Peninsula desk",
    category: "Desks",
    width: 200,
    depth: 140,
    symbol: (w, d) =>
      box("fp-f", 0, -d * 0.28, w, d * 0.4, 3) +
      box("fp-f", w * 0.22, d * 0.18, w * 0.45, d * 0.55, 3) +
      monitor(-20, -d * 0.42, 50) +
      chairTop(-20, -d * 0.02, 180, 34) +
      chairTop(w * 0.22, d * 0.42, 0, 32) +
      chairTop(w * 0.22 - 36, d * 0.18, -90, 32),
  },
  {
    kind: "office/desk-shared-4",
    label: "Shared desk for 4",
    category: "Desks",
    width: 240,
    depth: 160,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 4) +
      box("fp-f2", 0, 0, w * 0.96, 12, 2) +
      box("fp-f2", 0, 0, 12, d * 0.96, 2) +
      monitor(-w * 0.22, -d * 0.32, 44) +
      monitor(w * 0.22, -d * 0.32, 44) +
      monitor(-w * 0.22, d * 0.32, 44) +
      monitor(w * 0.22, d * 0.32, 44) +
      chairTop(-w * 0.22, -d * 0.48, 180, 32) +
      chairTop(w * 0.22, -d * 0.48, 180, 32) +
      chairTop(-w * 0.22, d * 0.48, 0, 32) +
      chairTop(w * 0.22, d * 0.48, 0, 32),
  },
  {
    kind: "office/laptop-bar",
    label: "Laptop bar",
    category: "Desks",
    width: 280,
    depth: 50,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      [-0.35, -0.12, 0.12, 0.35]
        .map(
          (t) =>
            box("fp-fl", w * t, -2, 28, 10, 2) +
            box("fp-tv", w * t, -10, 22, 3, 1),
        )
        .join(""),
  },
  {
    kind: "office/sit-stand-dual",
    label: "Dual sit-stand desk",
    category: "Desks",
    width: 200,
    depth: 80,
    symbol: (w, d) =>
      box("fp-f", -w * 0.26, 0, w * 0.44, d, 3) +
      box("fp-f", w * 0.26, 0, w * 0.44, d, 3) +
      box("fp-f2", 0, 0, 10, d * 0.7, 2) +
      monitor(-w * 0.26, -d / 2 + 12, 46) +
      monitor(w * 0.26, -d / 2 + 12, 46) +
      box("fp-fl", -w * 0.26 - 4, 6, 32, 10, 2) +
      box("fp-fl", w * 0.26 - 4, 6, 32, 10, 2),
  },
  {
    kind: "office/reception-island",
    label: "Reception island",
    category: "Desks",
    width: 220,
    depth: 220,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w * 0.72, d * 0.72, 8) +
      box("fp-f2", 0, 0, w * 0.48, d * 0.48, 6) +
      box("fp-fl", 0, -d * 0.08, 36, 12, 2) +
      monitor(0, -d * 0.22, 40) +
      chairTop(0, d * 0.08, 0, 32),
  },

  // —— Ещё перегородки ——
  {
    kind: "office/glass-door-partition",
    label: "Glass partition with door",
    category: "Screens & dividers",
    width: 200,
    depth: 20,
    symbol: (w, d) =>
      box("fp-f2", -w * 0.28, 0, w * 0.4, d, 1) +
      box("fp-f2", w * 0.28, 0, w * 0.4, d, 1) +
      box("fp-fl", 0, 0, w * 0.18, d * 0.9, 1) +
      circle("fp-f", w * 0.05, 0, 2),
  },
  {
    kind: "office/zigzag-screen",
    label: "Zigzag acoustic screen",
    category: "Screens & dividers",
    width: 180,
    depth: 60,
    symbol: (w, d) =>
      box("fp-fa", -w * 0.3, -d * 0.15, w * 0.35, 18, 4) +
      box("fp-fa", 0, d * 0.15, w * 0.35, 18, 4) +
      box("fp-fa", w * 0.3, -d * 0.15, w * 0.35, 18, 4),
  },
  {
    kind: "office/mobile-divider",
    label: "Mobile divider on wheels",
    category: "Screens & dividers",
    width: 120,
    depth: 30,
    symbol: (w, d) =>
      box("fp-f2", 0, 0, w, d * 0.7, 3) +
      circle("fp-fl", -w * 0.35, d * 0.35, 4) +
      circle("fp-fl", w * 0.35, d * 0.35, 4) +
      box("fp-fa", 0, 0, w * 0.85, d * 0.4, 2),
  },

  // —— Ещё стулья / мягкая ——
  {
    kind: "office/stacking-chair",
    label: "Stacking chair",
    category: "Chairs",
    width: 45,
    depth: 48,
    symbol: (_w, _d) =>
      box("fp-f", 0, 4, 28, 26, 4) +
      box("fp-f2", 0, -14, 30, 10, 3) +
      rect("fp-fl", -12, 14, 3, 10, 1) +
      rect("fp-fl", 9, 14, 3, 10, 1),
  },
  {
    kind: "office/cantilever-chair",
    label: "Cantilever chair",
    category: "Chairs",
    width: 50,
    depth: 55,
    symbol: (_w, _d) =>
      box("fp-f", 0, 2, 32, 28, 5) +
      box("fp-f2", 0, -16, 34, 12, 4) +
      rect("fp-fl", -14, 8, 3, 22, 1) +
      rect("fp-fl", 11, 8, 3, 22, 1),
  },
  {
    kind: "office/sofa-corner",
    label: "Corner sofa",
    category: "Chairs",
    width: 220,
    depth: 160,
    symbol: (w, d) =>
      box("fp-f", -w * 0.15, d * 0.22, w * 0.7, d * 0.5, 8) +
      box("fp-f", w * 0.22, -d * 0.12, w * 0.45, d * 0.7, 8) +
      box("fp-f2", -w * 0.15, d * 0.42, w * 0.7, 14, 5) +
      box("fp-f2", w * 0.38, -d * 0.12, 14, d * 0.7, 5),
  },
  {
    kind: "office/bean-bag",
    label: "Bean bag",
    category: "Chairs",
    width: 80,
    depth: 80,
    symbol: (_w, _d) =>
      ellipse("fp-f", 0, 4, 34, 30) + ellipse("fp-fa", 0, 0, 24, 20),
  },
  {
    kind: "office/nesting-stools",
    label: "Nesting stools set",
    category: "Chairs",
    width: 100,
    depth: 50,
    symbol: (w, _d) =>
      [-0.32, 0, 0.32]
        .map(
          (t, i) =>
            circle("fp-fl", w * t, 0, 16 - i) +
            circle("fp-f", w * t, 0, 12 - i * 0.5),
        )
        .join(""),
  },

  // —— Ещё переговорные ——
  {
    kind: "office/meeting-oval",
    label: "Oval meeting table",
    category: "Meeting",
    width: 280,
    depth: 120,
    symbol: (w, d) =>
      ellipse("fp-f", 0, 0, w / 2, d / 2) +
      ellipse("fp-f2", 0, 0, w * 0.35, d * 0.28) +
      [-0.35, -0.12, 0.12, 0.35]
        .map(
          (t) =>
            chairTop(w * t, -d * 0.42, 180, 30) +
            chairTop(w * t, d * 0.42, 0, 30),
        )
        .join(""),
  },
  {
    kind: "office/huddle-table",
    label: "Huddle table",
    category: "Meeting",
    width: 120,
    depth: 120,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w * 0.7, d * 0.7, 10) +
      chairTop(0, -d * 0.42, 180, 32) +
      chairTop(0, d * 0.42, 0, 32) +
      chairTop(-w * 0.42, 0, -90, 32) +
      chairTop(w * 0.42, 0, 90, 32),
  },
  {
    kind: "office/training-desk",
    label: "Training desk row",
    category: "Meeting",
    width: 200,
    depth: 55,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      [-0.33, 0, 0.33]
        .map((t) => chairTop(w * t, d * 0.55, 0, 30))
        .join(""),
  },
  {
    kind: "office/projector-screen",
    label: "Projector screen",
    category: "Meeting",
    width: 220,
    depth: 40,
    symbol: (w, d) =>
      box("fp-fl", 0, -d / 2 + 4, w, 6, 1) +
      box("fp-f", 0, 4, w * 0.92, d * 0.75, 2) +
      box("fp-f2", 0, 4, w * 0.82, d * 0.55, 1),
  },
  {
    kind: "office/projector",
    label: "Projector",
    category: "Meeting",
    width: 40,
    depth: 30,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      circle("fp-tv", w * 0.2, 0, 6) +
      box("fp-fl", -w * 0.2, 0, 10, 6, 1),
  },
  {
    kind: "office/conference-phone",
    label: "Conference phone",
    category: "Meeting",
    width: 45,
    depth: 45,
    symbol: (_w, _d) =>
      circle("fp-f", 0, 0, 18) +
      circle("fp-f2", 0, 0, 10) +
      circle("fp-fl", 0, 0, 4),
  },

  // —— Ещё зоны фокуса ——
  {
    kind: "office/nap-pod",
    label: "Nap pod",
    category: "Focus & lounge",
    width: 200,
    depth: 100,
    symbol: (w, d) =>
      ellipse("fp-f2", 0, 0, w / 2, d / 2) +
      ellipse("fp-f", 0, 4, w * 0.38, d * 0.32) +
      box("fp-fa", -w * 0.15, 0, w * 0.35, d * 0.4, 8),
  },
  {
    kind: "office/library-nook",
    label: "Library nook",
    category: "Focus & lounge",
    width: 160,
    depth: 120,
    symbol: (w, d) =>
      box("fp-f", -w * 0.35, 0, 28, d, 2) +
      box("fp-f", 0, d * 0.32, w * 0.7, d * 0.3, 6) +
      box("fp-f2", 0, d * 0.42, w * 0.7, 12, 4) +
      circle("fp-f", w * 0.2, -d * 0.15, 22),
  },
  {
    kind: "office/soft-booth-2",
    label: "Soft booth for 2",
    category: "Focus & lounge",
    width: 160,
    depth: 140,
    symbol: (w, d) =>
      box("fp-f2", 0, 0, w, d, 12) +
      box("fp-f", 0, -d * 0.15, w * 0.55, d * 0.35, 4) +
      chairTop(-w * 0.18, d * 0.2, 20, 32) +
      chairTop(w * 0.18, d * 0.2, -20, 32),
  },
  {
    kind: "office/game-table",
    label: "Breakout game table",
    category: "Focus & lounge",
    width: 100,
    depth: 100,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w * 0.7, d * 0.7, 4) +
      box("fp-fa", 0, 0, w * 0.45, d * 0.45, 2) +
      chairTop(0, -d * 0.42, 180, 30) +
      chairTop(0, d * 0.42, 0, 30) +
      chairTop(-w * 0.42, 0, -90, 30) +
      chairTop(w * 0.42, 0, 90, 30),
  },

  // —— Ещё хранение ——
  {
    kind: "office/archive-shelves",
    label: "Archive shelving",
    category: "Storage",
    width: 200,
    depth: 50,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      [-0.33, -0.11, 0.11, 0.33]
        .map((t) => rect("fp-fl", w * t - 1, -d / 2 + 4, 2, d - 8, 0))
        .join("") +
      [-0.25, 0, 0.25]
        .map((t) => rect("fp-fl", -w / 2 + 6, d * t, w - 12, 2, 0))
        .join(""),
  },
  {
    kind: "office/mobile-pedestal",
    label: "Mobile pedestal",
    category: "Storage",
    width: 45,
    depth: 55,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      rect("fp-fl", -w * 0.3, -d * 0.2, w * 0.6, 2, 0) +
      rect("fp-fl", -w * 0.3, d * 0.05, w * 0.6, 2, 0) +
      circle("fp-f2", -w * 0.25, d * 0.4, 3) +
      circle("fp-f2", w * 0.25, d * 0.4, 3),
  },
  {
    kind: "office/wardrobe-office",
    label: "Office wardrobe",
    category: "Storage",
    width: 100,
    depth: 55,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      rect("fp-fl", 0, -d / 2 + 4, 1.5, d - 8, 0) +
      circle("fp-f2", -w * 0.2, 0, 2.5) +
      circle("fp-f2", w * 0.2, 0, 2.5) +
      box("fp-fl", 0, -d * 0.25, w * 0.7, 4, 1),
  },
  {
    kind: "office/safe",
    label: "Safe",
    category: "Storage",
    width: 55,
    depth: 50,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      box("fp-f2", 0, 0, w * 0.7, d * 0.55, 2) +
      circle("fp-fl", w * 0.12, 0, 5) +
      circle("fp-tv", w * 0.12, 0, 2),
  },
  {
    kind: "office/mailbox-wall",
    label: "Mail slots wall",
    category: "Storage",
    width: 160,
    depth: 35,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      [-0.35, -0.12, 0.12, 0.35]
        .flatMap((tx) =>
          [-0.25, 0.25].map((ty) =>
            box("fp-f2", w * tx, d * ty, w * 0.18, d * 0.32, 1),
          ),
        )
        .join(""),
  },
  {
    kind: "office/bag-storage",
    label: "Bag lockers",
    category: "Storage",
    width: 140,
    depth: 40,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      [-0.3, 0, 0.3]
        .map(
          (t) =>
            box("fp-f2", w * t, 0, w * 0.22, d * 0.7, 2) +
            circle("fp-fl", w * t + w * 0.06, 0, 2),
        )
        .join(""),
  },

  // —— Ещё оборудование ——
  {
    kind: "office/mfp-large",
    label: "Large MFP with trays",
    category: "Equipment",
    width: 100,
    depth: 80,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 4) +
      box("fp-f2", 0, -d * 0.15, w * 0.8, d * 0.45, 3) +
      box("fp-tv", w * 0.22, d * 0.28, 22, 10, 2) +
      box("fp-fl", -w * 0.15, d * 0.28, 30, 12, 2) +
      box("fp-f2", 0, d * 0.42, w * 0.7, 8, 2),
  },
  {
    kind: "office/label-printer",
    label: "Label printer",
    category: "Equipment",
    width: 35,
    depth: 30,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      box("fp-f2", 0, -2, w * 0.7, d * 0.4, 2) +
      rect("fp-fl", -w * 0.25, d * 0.2, w * 0.5, 3, 1),
  },
  {
    kind: "office/scanner",
    label: "Document scanner",
    category: "Equipment",
    width: 50,
    depth: 40,
    symbol: (w, d) =>
      box("fp-f", 0, 2, w, d * 0.8, 3) +
      box("fp-f2", 0, -d * 0.25, w * 0.9, 8, 2) +
      rect("fp-tv", -w * 0.3, -d * 0.25, w * 0.6, 2, 0),
  },
  {
    kind: "office/server-rack-wide",
    label: "Wide server rack",
    category: "Equipment",
    width: 120,
    depth: 80,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      [-0.3, -0.1, 0.1, 0.3]
        .map((t) => rect("fp-fl", -w / 2 + 8, d * t - 1, w - 16, 2, 0))
        .join("") +
      box("fp-tv", 0, 0, w * 0.15, d * 0.5, 1),
  },
  {
    kind: "office/network-rack",
    label: "Network cabinet",
    category: "Equipment",
    width: 60,
    depth: 60,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      box("fp-f2", 0, 0, w * 0.7, d * 0.7, 1) +
      [-0.2, 0, 0.2]
        .map((t) => rect("fp-fl", -w * 0.25, d * t, w * 0.5, 2, 0))
        .join(""),
  },
  {
    kind: "office/ups",
    label: "UPS battery unit",
    category: "Equipment",
    width: 40,
    depth: 55,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      box("fp-f2", 0, -d * 0.15, w * 0.7, 8, 1) +
      box("fp-tv", 0, d * 0.2, w * 0.4, 6, 1),
  },
  {
    kind: "office/router-shelf",
    label: "Router / switch shelf",
    category: "Equipment",
    width: 70,
    depth: 35,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      box("fp-tv", 0, 0, w * 0.75, d * 0.45, 2) +
      [-0.25, 0, 0.25]
        .map((t) => circle("fp-fl", w * t, -d * 0.05, 2))
        .join(""),
  },
  {
    kind: "office/coffee-machine",
    label: "Coffee machine",
    category: "Equipment",
    width: 45,
    depth: 45,
    symbol: (w, d) =>
      box("fp-f", 0, 2, w * 0.85, d * 0.8, 4) +
      box("fp-f2", 0, -d * 0.2, w * 0.6, 10, 2) +
      circle("fp-fl", 0, d * 0.15, 5),
  },
  {
    kind: "office/kettle-station",
    label: "Tea / kettle station",
    category: "Equipment",
    width: 90,
    depth: 50,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      circle("fp-f2", -w * 0.22, 0, 10) +
      box("fp-fl", w * 0.2, 0, 22, 16, 3) +
      box("fp-f2", w * 0.2, -d * 0.2, 16, 6, 1),
  },
  {
    kind: "office/mini-fridge",
    label: "Mini fridge",
    category: "Equipment",
    width: 55,
    depth: 55,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      box("fp-f2", 0, -d * 0.05, w * 0.75, d * 0.7, 2) +
      rect("fp-fl", w * 0.28, -d * 0.15, 3, d * 0.35, 1),
  },
  {
    kind: "office/microwave",
    label: "Microwave",
    category: "Equipment",
    width: 50,
    depth: 40,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      box("fp-tv", -w * 0.08, 0, w * 0.55, d * 0.55, 2) +
      box("fp-f2", w * 0.28, 0, w * 0.2, d * 0.55, 2),
  },
  {
    kind: "office/dishwasher",
    label: "Office dishwasher",
    category: "Equipment",
    width: 60,
    depth: 60,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      box("fp-f2", 0, 0, w * 0.75, d * 0.55, 2) +
      rect("fp-fl", -w * 0.2, d * 0.28, w * 0.4, 3, 1),
  },
  {
    kind: "office/sink-kitchenette",
    label: "Kitchenette sink",
    category: "Equipment",
    width: 120,
    depth: 60,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      box("fp-f2", -w * 0.2, 0, w * 0.35, d * 0.45, 4) +
      circle("fp-fl", -w * 0.2, 0, 4) +
      box("fp-f2", w * 0.25, 0, w * 0.3, d * 0.5, 2),
  },
  {
    kind: "office/water-dispenser",
    label: "Bottle water dispenser",
    category: "Equipment",
    width: 40,
    depth: 40,
    symbol: (_w, _d) =>
      box("fp-f", 0, 6, 28, 24, 3) +
      circle("fp-water", 0, -10, 12) +
      box("fp-fl", 0, 14, 14, 6, 2),
  },
  {
    kind: "office/ice-maker",
    label: "Ice maker",
    category: "Equipment",
    width: 50,
    depth: 50,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      box("fp-f2", 0, -d * 0.1, w * 0.65, d * 0.4, 2) +
      box("fp-water", 0, d * 0.2, w * 0.4, 8, 2),
  },
  {
    kind: "office/hand-sanitizer",
    label: "Sanitizer stand",
    category: "Equipment",
    width: 30,
    depth: 30,
    symbol: (_w, _d) =>
      circle("fp-fl", 0, 10, 8) +
      box("fp-f", 0, -2, 12, 20, 3) +
      box("fp-f2", 0, -12, 10, 8, 2),
  },
  {
    kind: "office/aed-cabinet",
    label: "AED cabinet",
    category: "Equipment",
    width: 40,
    depth: 20,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      box("fp-fire", 0, 0, w * 0.45, d * 0.35, 1) +
      box("fp-f2", 0, d * 0.25, w * 0.5, 3, 1),
  },
  {
    kind: "office/cctv-desk",
    label: "Security monitor desk",
    category: "Equipment",
    width: 140,
    depth: 70,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      monitor(-35, -d / 2 + 12, 36) +
      monitor(0, -d / 2 + 12, 36) +
      monitor(35, -d / 2 + 12, 36) +
      chairTop(0, d * 0.25, 0, 32),
  },
  {
    kind: "office/access-terminal",
    label: "Access control terminal",
    category: "Equipment",
    width: 25,
    depth: 20,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      box("fp-tv", 0, -2, w * 0.6, d * 0.4, 1) +
      circle("fp-fl", 0, d * 0.2, 3),
  },
  {
    kind: "office/time-clock",
    label: "Time clock",
    category: "Equipment",
    width: 30,
    depth: 20,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      box("fp-f2", 0, 0, w * 0.65, d * 0.5, 1) +
      rect("fp-tv", -4, -4, 8, 2, 0),
  },
  {
    kind: "office/laptop-cart",
    label: "Laptop charging cart",
    category: "Equipment",
    width: 90,
    depth: 60,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      [-0.25, 0, 0.25]
        .map((t) => box("fp-f2", w * t, 0, w * 0.18, d * 0.65, 2))
        .join("") +
      circle("fp-fl", -w * 0.35, d * 0.4, 4) +
      circle("fp-fl", w * 0.35, d * 0.4, 4),
  },
  {
    kind: "office/3d-printer",
    label: "3D printer",
    category: "Equipment",
    width: 55,
    depth: 55,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      box("fp-f2", 0, 0, w * 0.65, d * 0.65, 2) +
      box("fp-tv", 0, -d * 0.15, w * 0.4, 4, 1) +
      rect("fp-fl", -w * 0.2, d * 0.2, w * 0.4, 3, 0),
  },
  {
    kind: "office/lamination",
    label: "Laminator",
    category: "Equipment",
    width: 50,
    depth: 30,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      rect("fp-fl", -w * 0.35, 0, w * 0.7, 3, 1) +
      box("fp-f2", w * 0.3, 0, 8, d * 0.5, 1),
  },
  {
    kind: "office/paper-cutter",
    label: "Paper cutter",
    category: "Equipment",
    width: 70,
    depth: 50,
    symbol: (w, d) =>
      box("fp-f", 0, 2, w, d * 0.85, 2) +
      rect("fp-tv", -w * 0.4, -d * 0.1, w * 0.8, 2, 0) +
      g(w * 0.35, -d * 0.05, -25, rect("fp-fl", 0, -1, 28, 3, 1)),
  },
  {
    kind: "office/mail-cart",
    label: "Mail cart",
    category: "Equipment",
    width: 70,
    depth: 45,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      box("fp-f2", 0, 0, w * 0.75, d * 0.55, 2) +
      circle("fp-fl", -w * 0.3, d * 0.4, 4) +
      circle("fp-fl", w * 0.3, d * 0.4, 4) +
      rect("fp-fl", -w * 0.45, -d * 0.35, 8, d * 0.5, 1),
  },
  {
    kind: "office/cleaning-cart",
    label: "Cleaning cart",
    category: "Equipment",
    width: 80,
    depth: 45,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w * 0.7, d, 3) +
      box("fp-f2", -w * 0.35, 0, 16, d * 0.7, 4) +
      circle("fp-fl", -w * 0.25, d * 0.4, 4) +
      circle("fp-fl", w * 0.2, d * 0.4, 4),
  },
  {
    kind: "office/umbrella-stand",
    label: "Umbrella stand",
    category: "Equipment",
    width: 35,
    depth: 35,
    symbol: (_w, _d) =>
      circle("fp-f", 0, 0, 14) +
      circle("fp-f2", 0, 0, 9) +
      [-40, 20, 90].map((deg) => g(0, 0, deg, rect("fp-fl", 2, -1, 12, 2, 1))).join(""),
  },
  {
    kind: "office/bike-rack",
    label: "Bike rack",
    category: "Equipment",
    width: 180,
    depth: 50,
    symbol: (w, d) =>
      box("fp-fl", 0, d * 0.3, w, 4, 1) +
      [-0.35, -0.12, 0.12, 0.35]
        .map(
          (t) =>
            circle("fp-fl", w * t - 12, 0, 10) +
            circle("fp-fl", w * t + 12, 0, 10) +
            rect("fp-f2", w * t - 2, -8, 4, 20, 1),
        )
        .join(""),
  },
  {
    kind: "office/locker-bench",
    label: "Locker room bench",
    category: "Equipment",
    width: 160,
    depth: 40,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d * 0.55, 3) +
      rect("fp-fl", -w * 0.4, d * 0.15, 4, 12, 1) +
      rect("fp-fl", w * 0.4, d * 0.15, 4, 12, 1),
  },
  {
    kind: "office/power-pole",
    label: "Floor power pole",
    category: "Equipment",
    width: 25,
    depth: 25,
    symbol: (_w, _d) =>
      circle("fp-f", 0, 0, 8) +
      box("fp-f2", 0, 0, 6, 18, 1) +
      circle("fp-fl", 0, -10, 3),
  },
  {
    kind: "office/cable-tray",
    label: "Cable management tray",
    category: "Equipment",
    width: 120,
    depth: 20,
    symbol: (w, d) =>
      box("fp-f2", 0, 0, w, d, 2) +
      [-0.3, 0, 0.3]
        .map((t) => circle("fp-fl", w * t, 0, 3))
        .join(""),
  },
  {
    kind: "office/whiteboard-wall",
    label: "Wall whiteboard",
    category: "Equipment",
    width: 240,
    depth: 25,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      box("fp-f2", 0, 0, w * 0.92, d * 0.55, 1) +
      rect("fp-fl", -w * 0.35, -d * 0.1, w * 0.4, 2, 0),
  },
  {
    kind: "office/notice-board",
    label: "Notice board",
    category: "Equipment",
    width: 140,
    depth: 20,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      box("fp-fa", 0, 0, w * 0.88, d * 0.6, 1) +
      [-0.25, 0, 0.25]
        .map((t) => box("fp-f2", w * t, 0, 18, 8, 1))
        .join(""),
  },
  {
    kind: "office/evacuation-map",
    label: "Evacuation plan poster",
    category: "Equipment",
    width: 60,
    depth: 4,
    /** Цветной постер на стене (этажный 600×400 мм по ГОСТ). */
    symbol: (w, d) => {
      const bw = Math.max(w, 40);
      const bh = Math.max(d * 8, 28);
      return (
        `<rect x="${round(-bw / 2)}" y="${round(-bh / 2)}" width="${round(bw)}" height="${round(bh)}" rx="1" fill="#FFFCE8" stroke="#1a1a1a" stroke-width="1.2"/>` +
        `<rect x="${round(-bw / 2 + 2)}" y="${round(-bh / 2 + 2)}" width="${round(bw - 4)}" height="${round(bh * 0.22)}" fill="#00A651"/>` +
        `<polyline points="${round(-bw * 0.28)},${round(4)} ${round(-bw * 0.05)},${round(-2)} ${round(bw * 0.22)},${round(-6)}" fill="none" stroke="#00A651" stroke-width="2.2" stroke-linecap="round"/>` +
        `<circle cx="${round(bw * 0.22)}" cy="${round(-6)}" r="2.2" fill="#E30613"/>` +
        `<rect x="${round(-bw * 0.32)}" y="${round(bh * 0.18)}" width="5" height="7" rx="0.5" fill="#E30613"/>` +
        `<rect x="${round(bw * 0.2)}" y="${round(bh * 0.14)}" width="8" height="5" rx="0.5" fill="#c5d0de" stroke="#7b8794" stroke-width="0.5"/>`
      );
    },
  },
  {
    kind: "office/flag-stand",
    label: "Flag stand",
    category: "Equipment",
    width: 40,
    depth: 40,
    symbol: (_w, _d) =>
      circle("fp-f", 0, 12, 10) +
      rect("fp-fl", -1.5, -18, 3, 36, 1) +
      box("fp-fa", 12, -12, 22, 14, 1),
  },

  // —— Ещё растения ——
  {
    kind: "office/hedge-planter",
    label: "Hedge planter",
    category: "Plants",
    width: 180,
    depth: 40,
    symbol: (w, d) =>
      box("fp-f2", 0, d * 0.15, w, d * 0.55, 3) +
      box("fp-soil", 0, d * 0.1, w * 0.92, d * 0.35, 2) +
      [-0.35, -0.18, 0, 0.18, 0.35]
        .map((t) => ellipse("fp-leaf2", w * t, -d * 0.15, 10, 14))
        .join(""),
  },
  {
    kind: "office/hanging-plant",
    label: "Hanging plant",
    category: "Plants",
    width: 40,
    depth: 40,
    symbol: (_w, _d) =>
      circle("fp-f2", 0, -8, 10) +
      circle("fp-soil", 0, -8, 7) +
      g(0, 2, 0, ellipse("fp-leaf", 0, 8, 5, 12)) +
      g(0, 2, 140, ellipse("fp-leaf2", 0, 8, 5, 11)) +
      g(0, 2, 250, ellipse("fp-leaf", 0, 7, 4, 10)),
  },
  {
    kind: "office/cactus-set",
    label: "Cactus set",
    category: "Plants",
    width: 70,
    depth: 35,
    symbol: (w, _d) =>
      [-0.3, 0, 0.3]
        .map(
          (t, i) =>
            box("fp-f2", w * t, 8, 14, 10, 2) +
            box("fp-leaf2", w * t, -2 - i * 2, 6, 16 + i * 3, 3),
        )
        .join(""),
  },

  // —— Офис: рабочие места ——
  {
    kind: "office/desk-dual-monitor",
    label: "Desk with dual monitors",
    category: "Desks",
    width: 140,
    depth: 70,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      monitor(-w * 0.16, -d / 2 + 12, 42) +
      monitor(w * 0.16, -d / 2 + 12, 42) +
      box("fp-fl", -8, 6, 36, 12, 2) +
      box("fp-f2", w * 0.32, 8, 22, 28, 2),
  },
  {
    kind: "office/standing-desk",
    label: "Sit-stand desk",
    category: "Desks",
    width: 130,
    depth: 65,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      monitor(0, -d / 2 + 12, 50) +
      box("fp-fl", 0, 8, 40, 12, 2) +
      rect("fp-f2", -w * 0.35, d * 0.2, 8, 14, 1) +
      rect("fp-f2", w * 0.35 - 8, d * 0.2, 8, 14, 1),
  },
  {
    kind: "office/desk-with-return",
    label: "Desk with return",
    category: "Desks",
    width: 180,
    depth: 140,
    symbol: (w, d) =>
      box("fp-f", 0, -d * 0.28, w, d * 0.4, 3) +
      box("fp-f", -w * 0.28, d * 0.18, w * 0.4, d * 0.55, 3) +
      monitor(0, -d * 0.42, 52) +
      box("fp-fl", 10, -d * 0.12, 36, 12, 2) +
      chairTop(w * 0.1, -d * 0.02, 0, 32),
  },
  {
    kind: "office/hotdesk-pod",
    label: "Hot-desk pod for 2",
    category: "Desks",
    width: 200,
    depth: 90,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d * 0.55, 3) +
      box("fp-f2", 0, -d * 0.08, 12, d * 0.7, 2) +
      monitor(-w * 0.28, -d * 0.12, 44) +
      monitor(w * 0.28, -d * 0.12, 44) +
      chairTop(-w * 0.28, d * 0.42, 0, 30) +
      chairTop(w * 0.28, d * 0.42, 0, 30),
  },
  {
    kind: "office/mesh-task-chair",
    label: "Mesh task chair",
    category: "Seating",
    width: 50,
    depth: 52,
    symbol: (_w, _d) =>
      circle("fp-fl", 0, 6, 18) +
      box("fp-f", 0, 2, 34, 36, 8) +
      box("fp-f2", 0, -14, 30, 10, 3) +
      rect("fp-fl", -16, 10, 3, 18, 1) +
      rect("fp-fl", 13, 10, 3, 18, 1),
  },
  {
    kind: "office/guest-chairs-pair",
    label: "Guest chairs pair",
    category: "Seating",
    width: 110,
    depth: 55,
    symbol: (w, d) =>
      chairTop(-w * 0.28, 0, 0, 34) +
      chairTop(w * 0.28, 0, 0, 34) +
      box("fp-fl", 0, d * 0.35, w * 0.7, 6, 2),
  },
  {
    kind: "office/desk-lamp",
    label: "Desk lamp",
    category: "Equipment",
    width: 28,
    depth: 28,
    symbol: (_w, _d) =>
      circle("fp-f2", 0, 8, 8) +
      rect("fp-fl", -1.5, -6, 3, 18, 1) +
      ellipse("fp-fa", 6, -12, 10, 6),
  },
  {
    kind: "office/monitor-arm",
    label: "Monitor arm dual",
    category: "Equipment",
    width: 70,
    depth: 30,
    symbol: (w, d) =>
      box("fp-f2", 0, d * 0.2, 14, 12, 2) +
      rect("fp-fl", -2, -8, 4, 20, 1) +
      box("fp-tv", -w * 0.28, -6, 28, 8, 1) +
      box("fp-tv", w * 0.28, -6, 28, 8, 1),
  },
  {
    kind: "office/docking-station",
    label: "Docking station",
    category: "Equipment",
    width: 40,
    depth: 25,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      box("fp-f2", 0, -2, w * 0.7, d * 0.45, 1) +
      [-0.25, 0, 0.25]
        .map((t) => circle("fp-fl", w * t, d * 0.2, 2))
        .join(""),
  },
  {
    kind: "office/underdesk-cpu",
    label: "Under-desk PC mount",
    category: "Equipment",
    width: 45,
    depth: 50,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      box("fp-f2", 0, 0, w * 0.7, d * 0.55, 2) +
      circle("fp-fl", 0, d * 0.28, 4),
  },
  {
    kind: "office/personal-locker",
    label: "Personal locker",
    category: "Storage",
    width: 40,
    depth: 45,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      box("fp-f2", 0, -d * 0.05, w * 0.75, d * 0.7, 1) +
      circle("fp-fl", w * 0.12, 0, 3),
  },
  {
    kind: "office/filing-cabinet-2",
    label: "2-drawer filing cabinet",
    category: "Storage",
    width: 50,
    depth: 60,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      rect("fp-fl", -w * 0.35, -d * 0.22, w * 0.7, 2, 0) +
      rect("fp-fl", -w * 0.35, d * 0.08, w * 0.7, 2, 0) +
      box("fp-f2", 0, -d * 0.12, 12, 6, 1) +
      box("fp-f2", 0, d * 0.18, 12, 6, 1),
  },
  {
    kind: "office/desk-privacy-panel",
    label: "Desk privacy panel",
    category: "Partitions",
    width: 140,
    depth: 18,
    symbol: (w, d) =>
      box("fp-fa", 0, 0, w, d, 2) +
      box("fp-f2", 0, 0, w * 0.92, d * 0.55, 1),
  },
  {
    kind: "office/footrest",
    label: "Footrest",
    category: "Equipment",
    width: 45,
    depth: 35,
    symbol: (w, d) =>
      box("fp-f2", 0, 0, w, d, 4) + box("fp-fl", 0, -d * 0.1, w * 0.7, 4, 2),
  },

  // —— Переговорные / ВКС ——
  {
    kind: "office/meeting-table-6",
    label: "Meeting table, 6 seats",
    category: "Meeting",
    width: 220,
    depth: 110,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 8) +
      box("fp-f2", 0, 0, w * 0.55, d * 0.35, 4) +
      [-0.32, 0, 0.32]
        .map(
          (t) =>
            chairTop(w * t, -d * 0.55, 180, 30) +
            chairTop(w * t, d * 0.55, 0, 30),
        )
        .join(""),
  },
  {
    kind: "office/meeting-table-8",
    label: "Meeting table, 8 seats",
    category: "Meeting",
    width: 280,
    depth: 120,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 8) +
      box("fp-f2", 0, 0, w * 0.5, d * 0.32, 4) +
      [-0.36, -0.12, 0.12, 0.36]
        .map(
          (t) =>
            chairTop(w * t, -d * 0.55, 180, 28) +
            chairTop(w * t, d * 0.55, 0, 28),
        )
        .join(""),
  },
  {
    kind: "office/meeting-table-10",
    label: "Boardroom table, 10 seats",
    category: "Meeting",
    width: 340,
    depth: 130,
    symbol: (w, d) =>
      ellipse("fp-f", 0, 0, w / 2, d / 2) +
      ellipse("fp-f2", 0, 0, w * 0.32, d * 0.28) +
      [-0.4, -0.2, 0, 0.2, 0.4]
        .map(
          (t) =>
            chairTop(w * t, -d * 0.48, 180, 28) +
            chairTop(w * t, d * 0.48, 0, 28),
        )
        .join(""),
  },
  {
    kind: "office/meeting-round-4",
    label: "Round meeting table, 4 seats",
    category: "Meeting",
    width: 130,
    depth: 130,
    symbol: (w, d) =>
      circle("fp-f", 0, 0, w * 0.42) +
      circle("fp-f2", 0, 0, w * 0.18) +
      chairTop(0, -d * 0.48, 180, 30) +
      chairTop(0, d * 0.48, 0, 30) +
      chairTop(-w * 0.48, 0, -90, 30) +
      chairTop(w * 0.48, 0, 90, 30),
  },
  {
    kind: "office/meeting-chair",
    label: "Meeting chair",
    category: "Seating",
    width: 48,
    depth: 50,
    symbol: (_w, _d) =>
      box("fp-f", 0, 4, 32, 30, 6) +
      box("fp-f2", 0, -12, 30, 12, 4) +
      circle("fp-fl", -14, 14, 4) +
      circle("fp-fl", 14, 14, 4),
  },
  {
    kind: "office/vc-display-wall",
    label: "Video conference display wall",
    category: "Meeting",
    width: 260,
    depth: 35,
    symbol: (w, d) =>
      box("fp-f", 0, d * 0.15, w, d * 0.55, 2) +
      box("fp-tv", -w * 0.22, -2, w * 0.38, d * 0.7, 2) +
      box("fp-tv", w * 0.22, -2, w * 0.38, d * 0.7, 2) +
      circle("fp-fl", 0, -d * 0.35, 4),
  },
  {
    kind: "office/interactive-display",
    label: "Interactive touch display",
    category: "Meeting",
    width: 180,
    depth: 40,
    symbol: (w, d) =>
      box("fp-f2", 0, d * 0.2, w * 0.35, 12, 2) +
      box("fp-tv", 0, -4, w * 0.9, d * 0.7, 2) +
      box("fp-f", 0, -4, w * 0.78, d * 0.5, 1),
  },
  {
    kind: "office/vc-camera-bar",
    label: "VC camera bar",
    category: "Meeting",
    width: 80,
    depth: 20,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      circle("fp-tv", 0, 0, 5) +
      box("fp-fl", -w * 0.28, 0, 10, 6, 1) +
      box("fp-fl", w * 0.28, 0, 10, 6, 1),
  },
  {
    kind: "office/soundbar",
    label: "Conference soundbar",
    category: "Meeting",
    width: 120,
    depth: 18,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 4) +
      [-0.3, -0.1, 0.1, 0.3]
        .map((t) => circle("fp-fl", w * t, 0, 2.5))
        .join(""),
  },
  {
    kind: "office/av-credenza",
    label: "AV media credenza",
    category: "Meeting",
    width: 160,
    depth: 45,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      [-0.3, 0, 0.3]
        .map((t) => box("fp-f2", w * t, 0, w * 0.22, d * 0.65, 2))
        .join("") +
      box("fp-tv", 0, -d * 0.55, w * 0.7, 8, 1),
  },
  {
    kind: "office/mobile-whiteboard",
    label: "Mobile whiteboard",
    category: "Meeting",
    width: 160,
    depth: 50,
    symbol: (w, d) =>
      box("fp-f", 0, -2, w * 0.9, d * 0.45, 2) +
      box("fp-f2", 0, -2, w * 0.78, d * 0.28, 1) +
      circle("fp-fl", -w * 0.35, d * 0.32, 5) +
      circle("fp-fl", w * 0.35, d * 0.32, 5) +
      rect("fp-fl", -w * 0.4, d * 0.05, w * 0.8, 3, 1),
  },
  {
    kind: "office/glass-board",
    label: "Glass writing board",
    category: "Meeting",
    width: 200,
    depth: 22,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 2) +
      box("fp-f2", 0, 0, w * 0.92, d * 0.55, 1) +
      rect("fp-fl", -w * 0.3, -2, w * 0.35, 2, 0),
  },
  {
    kind: "office/document-camera",
    label: "Document camera",
    category: "Meeting",
    width: 35,
    depth: 40,
    symbol: (w, d) =>
      box("fp-f", 0, d * 0.15, w, d * 0.5, 2) +
      rect("fp-fl", -1.5, -12, 3, 22, 1) +
      circle("fp-tv", 0, -14, 6),
  },
  {
    kind: "office/clicker-dock",
    label: "Presenter clicker dock",
    category: "Meeting",
    width: 30,
    depth: 25,
    symbol: (w, d) =>
      box("fp-f2", 0, 0, w, d, 3) +
      box("fp-f", 0, -2, w * 0.45, d * 0.7, 2) +
      circle("fp-fl", 0, 6, 3),
  },
  {
    kind: "office/nameplate-stand",
    label: "Nameplate stand",
    category: "Meeting",
    width: 35,
    depth: 20,
    symbol: (w, d) =>
      box("fp-f2", 0, d * 0.2, w * 0.7, 6, 1) +
      box("fp-f", 0, -2, w, d * 0.7, 2) +
      rect("fp-fl", -w * 0.3, -4, w * 0.6, 2, 0),
  },
  {
    kind: "office/acoustic-panel",
    label: "Acoustic wall panel",
    category: "Partitions",
    width: 100,
    depth: 20,
    symbol: (w, d) =>
      box("fp-fa", 0, 0, w, d, 3) +
      [-0.3, 0, 0.3]
        .map((t) => rect("fp-fl", w * t - 8, -d * 0.25, 16, d * 0.5, 2))
        .join(""),
  },
  {
    kind: "office/meeting-sideboard",
    label: "Meeting room sideboard",
    category: "Meeting",
    width: 180,
    depth: 45,
    symbol: (w, d) =>
      box("fp-f", 0, 0, w, d, 3) +
      [-0.28, 0, 0.28]
        .map((t) => box("fp-f2", w * t, 0, w * 0.24, d * 0.65, 2))
        .join("") +
      box("fp-fl", -w * 0.15, -d * 0.35, 40, 8, 1),
  },
  {
    kind: "office/power-hub-table",
    label: "Table power hub",
    category: "Meeting",
    width: 35,
    depth: 35,
    symbol: (_w, _d) =>
      circle("fp-f", 0, 0, 14) +
      circle("fp-f2", 0, 0, 8) +
      [-0.35, 0.35]
        .map((t) => rect("fp-fl", t * 10 - 2, -6, 4, 12, 1))
        .join(""),
  },
];
