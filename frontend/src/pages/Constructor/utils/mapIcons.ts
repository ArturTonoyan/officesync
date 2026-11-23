/** Аккуратные top-down SVG для карты (data URL) */

const svg = (body: string, w = 64, h = 64) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">${body}</svg>`,
  )}`;

export const MAP_ICONS = {
  wall: svg(
    `<rect width="64" height="64" fill="#4A5568"/>`,
    64,
    64,
  ),
  room: svg(
    `<rect x="1" y="1" width="126" height="94" rx="2" fill="#E8EEF6" stroke="#94A3B8" stroke-width="2"/>`,
    128,
    96,
  ),
  meeting: svg(
    `<rect x="1" y="1" width="126" height="94" rx="2" fill="#E0F2F1" stroke="#5B9A94" stroke-width="2"/>
     <ellipse cx="64" cy="48" rx="28" ry="16" fill="#B2DFDB" stroke="#5B9A94" stroke-width="1.5"/>
     <circle cx="40" cy="36" r="5" fill="#80CBC4"/><circle cx="88" cy="36" r="5" fill="#80CBC4"/>
     <circle cx="40" cy="60" r="5" fill="#80CBC4"/><circle cx="88" cy="60" r="5" fill="#80CBC4"/>`,
    128,
    96,
  ),
  workplace: svg(
    `<circle cx="24" cy="24" r="22" fill="#ECFDF5" stroke="#22C55E" stroke-width="2.5"/>
     <circle cx="24" cy="24" r="6" fill="#22C55E"/>`,
    48,
    48,
  ),
  desk: svg(
    `<rect x="4" y="14" width="56" height="36" rx="2" fill="#E2E8F0" stroke="#64748B" stroke-width="1.5"/>
     <rect x="8" y="18" width="20" height="12" rx="1" fill="#CBD5E1" stroke="#94A3B8"/>
     <rect x="36" y="8" width="16" height="8" rx="1" fill="#94A3B8"/>`,
    64,
    64,
  ),
  chair: svg(
    `<rect x="18" y="22" width="28" height="26" rx="4" fill="#3B82F6" stroke="#1D4ED8" stroke-width="1.5"/>
     <rect x="14" y="18" width="36" height="8" rx="2" fill="#60A5FA" stroke="#1D4ED8" stroke-width="1"/>
     <circle cx="22" cy="52" r="3" fill="#1E40AF"/><circle cx="42" cy="52" r="3" fill="#1E40AF"/>`,
    64,
    64,
  ),
  sofa: svg(
    `<rect x="4" y="20" width="56" height="28" rx="4" fill="#94A3B8" stroke="#64748B" stroke-width="1.5"/>
     <rect x="4" y="14" width="12" height="20" rx="3" fill="#CBD5E1" stroke="#64748B"/>
     <rect x="48" y="14" width="12" height="20" rx="3" fill="#CBD5E1" stroke="#64748B"/>`,
    64,
    64,
  ),
  table: svg(
    `<rect x="6" y="16" width="52" height="32" rx="2" fill="#F1F5F9" stroke="#64748B" stroke-width="1.5"/>
     <rect x="10" y="20" width="44" height="24" rx="1" fill="#E2E8F0"/>`,
    64,
    64,
  ),
  roundTable: svg(
    `<circle cx="32" cy="32" r="26" fill="#F1F5F9" stroke="#64748B" stroke-width="1.5"/>
     <circle cx="32" cy="32" r="18" fill="#E2E8F0"/>
     <circle cx="32" cy="10" r="4" fill="#94A3B8"/><circle cx="32" cy="54" r="4" fill="#94A3B8"/>
     <circle cx="10" cy="32" r="4" fill="#94A3B8"/><circle cx="54" cy="32" r="4" fill="#94A3B8"/>`,
    64,
    64,
  ),
  cabinet: svg(
    `<rect x="12" y="6" width="40" height="52" rx="2" fill="#CBD5E1" stroke="#64748B" stroke-width="1.5"/>
     <line x1="32" y1="8" x2="32" y2="56" stroke="#94A3B8" stroke-width="1"/>
     <circle cx="28" cy="32" r="1.5" fill="#64748B"/><circle cx="36" cy="32" r="1.5" fill="#64748B"/>`,
    64,
    64,
  ),
  door: svg(
    `<rect x="4" y="8" width="8" height="48" rx="1" fill="#78716C" stroke="#57534E" stroke-width="1"/>
     <path d="M12 12 Q48 32 12 52" fill="none" stroke="#A8A29E" stroke-width="1.5" stroke-dasharray="3 2"/>`,
    64,
    64,
  ),
  plant: svg(
    `<ellipse cx="32" cy="44" rx="14" ry="8" fill="#86EFAC" stroke="#16A34A" stroke-width="1"/>
     <path d="M32 44 C28 28 20 20 24 12 C30 18 32 28 32 44" fill="#22C55E"/>
     <path d="M32 44 C36 28 44 20 40 12 C34 18 32 28 32 44" fill="#16A34A"/>
     <rect x="26" y="44" width="12" height="10" rx="1" fill="#A8A29E"/>`,
    64,
    64,
  ),
  coffee: svg(
    `<rect x="16" y="18" width="32" height="28" rx="3" fill="#E7E5E4" stroke="#78716C" stroke-width="1.5"/>
     <ellipse cx="32" cy="28" rx="8" ry="3" fill="#A8A29E"/>
     <path d="M48 26 h6 a6 6 0 0 1 0 12 h-6" fill="none" stroke="#78716C" stroke-width="1.5"/>`,
    64,
    64,
  ),
  printer: svg(
    `<rect x="10" y="22" width="44" height="24" rx="2" fill="#94A3B8" stroke="#64748B" stroke-width="1.5"/>
     <rect x="16" y="12" width="32" height="14" rx="1" fill="#E2E8F0" stroke="#64748B"/>
     <rect x="18" y="36" width="28" height="6" rx="1" fill="#F8FAFC"/>`,
    64,
    64,
  ),
  monitor: svg(
    `<rect x="10" y="10" width="44" height="30" rx="2" fill="#1E293B" stroke="#0F172A" stroke-width="1.5"/>
     <rect x="14" y="14" width="36" height="22" rx="1" fill="#38BDF8" opacity="0.35"/>
     <rect x="28" y="40" width="8" height="6" fill="#64748B"/>
     <rect x="20" y="46" width="24" height="4" rx="1" fill="#94A3B8"/>`,
    64,
    64,
  ),
  server: svg(
    `<rect x="14" y="8" width="36" height="48" rx="2" fill="#334155" stroke="#1E293B" stroke-width="1.5"/>
     <rect x="18" y="14" width="28" height="8" rx="1" fill="#475569"/>
     <rect x="18" y="28" width="28" height="8" rx="1" fill="#475569"/>
     <rect x="18" y="42" width="28" height="8" rx="1" fill="#475569"/>
     <circle cx="22" cy="18" r="1.5" fill="#22C55E"/><circle cx="22" cy="32" r="1.5" fill="#22C55E"/>
     <circle cx="22" cy="46" r="1.5" fill="#F59E0B"/>`,
    64,
    64,
  ),
} as const;

export type MapIconKey = keyof typeof MAP_ICONS;

export const FURNITURE_PRESETS: {
  key: MapIconKey;
  label: string;
  type: string;
  width: number;
  height: number;
  zIndex: number;
}[] = [
  { key: "desk", label: "Стол", type: "Мебель", width: 80, height: 50, zIndex: 400 },
  { key: "chair", label: "Стул", type: "Мебель", width: 36, height: 36, zIndex: 450 },
  { key: "sofa", label: "Диван", type: "Мебель", width: 90, height: 45, zIndex: 400 },
  { key: "table", label: "Стол прямоуг.", type: "Мебель", width: 100, height: 60, zIndex: 400 },
  { key: "roundTable", label: "Круглый стол", type: "Мебель", width: 70, height: 70, zIndex: 400 },
  { key: "cabinet", label: "Шкаф", type: "Мебель", width: 40, height: 70, zIndex: 400 },
  { key: "plant", label: "Растение", type: "Мебель", width: 32, height: 32, zIndex: 420 },
  { key: "coffee", label: "Кофе-поинт", type: "Мебель", width: 40, height: 40, zIndex: 400 },
  { key: "printer", label: "Принтер", type: "Оборудование", width: 44, height: 36, zIndex: 500 },
  { key: "monitor", label: "Монитор", type: "Оборудование", width: 40, height: 36, zIndex: 500 },
  { key: "server", label: "Сервер", type: "Оборудование", width: 36, height: 48, zIndex: 500 },
];

export const OBJECT_COLORS: Record<string, { fill: string; stroke: string; label?: string }> = {
  Стена: { fill: "#4A5568", stroke: "#2D3748" },
  Кабинет: { fill: "rgba(232, 238, 246, 0.72)", stroke: "#64748B", label: "#334155" },
  Переговорная: { fill: "rgba(224, 242, 241, 0.75)", stroke: "#5B9A94", label: "#1F5C57" },
  Этаж: { fill: "rgba(248, 250, 252, 0.5)", stroke: "#CBD5E1", label: "#64748B" },
  "Рабочее место": { fill: "#ECFDF5", stroke: "#22C55E" },
  Дверь: { fill: "#A8A29E", stroke: "#57534E" },
};

export const SHAPE_TYPES = ["Стена", "Кабинет", "Переговорная", "Этаж", "Рабочее место", "Дверь"];
