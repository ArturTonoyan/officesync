import type {
  FurnitureCatalogOption,
  GenerationReport,
  NormViolation,
} from "./types";

export const FURNITURE_OPTIONS: FurnitureCatalogOption[] = [
  { id: "desk", label: "Рабочий стол", kind: "office/desk-dual-monitor" },
  { id: "standing-desk", label: "Sit-stand стол", kind: "office/standing-desk" },
  { id: "executive-desk", label: "Стол руководителя", kind: "office/executive-desk" },
  { id: "meeting-table", label: "Стол переговоров (6)", kind: "office/meeting-table-6" },
  { id: "meeting-table-8", label: "Стол переговоров (8)", kind: "office/meeting-table-8" },
  { id: "meeting-round", label: "Круглый стол (4)", kind: "office/meeting-round-4" },
  { id: "whiteboard", label: "Доска / флипчарт", kind: "office/whiteboard-wall" },
  { id: "vc-display", label: "Экран ВКС", kind: "office/vc-display-wall" },
  { id: "chair", label: "Офисный стул", kind: "office/mesh-task-chair" },
  { id: "meeting-chair", label: "Стул переговоров", kind: "office/meeting-chair" },
  { id: "sofa", label: "Диван", kind: "office/sofa-2" },
  { id: "lounge", label: "Lounge-зона", kind: "office/lounge-set" },
  { id: "plant", label: "Растение", kind: "office/round-planter" },
  { id: "cabinet", label: "Шкаф / стеллаж", kind: "office/tall-cabinet" },
  { id: "focus-booth", label: "Фокус-будка", kind: "office/focus-booth" },
  { id: "reception-desk", label: "Стойка ресепшен", kind: "office/waiting-bench" },
];

export const DENSITY_OPTIONS = [
  { value: "low" as const, label: "Низкая" },
  { value: "medium" as const, label: "Средняя" },
  { value: "high" as const, label: "Высокая" },
];

export const TEXT_EDIT_HINTS = [
  "Сдвинь переговорки ближе к входу",
  "Добавь ещё 4 стола",
  "Убери растения у выхода",
  "Сделай кабинет Иванова больше",
];

export const MOCK_REPORT: GenerationReport = {
  created: [
    "24 рабочих места",
    "2 переговорные (бронируемые)",
    "1 конференц-зал",
    "зона отдыха",
  ],
  skipped: ["конференц не влез по площади — уменьшен до 8 мест"],
  norms: [
    { id: "n1", label: "Пересечения мебели", status: "ok" },
    { id: "n2", label: "Ширина прохода", status: "warn" },
    { id: "n3", label: "Зона открывания двери", status: "ok" },
    { id: "n4", label: "Плотность рабочих мест", status: "ok" },
  ],
};

export const MOCK_VIOLATIONS: NormViolation[] = [
  {
    id: "v1",
    severity: "error",
    message: "Проход уже 900 мм (норма ≥ 1200 мм)",
    objectLabel: "Стол #12",
  },
  {
    id: "v2",
    severity: "warning",
    message: "Рабочее место далеко от выхода (> 40 м)",
    objectLabel: "Место у северной стены",
  },
];

export const GENERATION_PHASE_LABEL: Record<string, string> = {
  idle: "",
  parse: "Ollama: комплектация комнат…",
  layout: "Расстановка…",
  validate: "Проверка норм…",
  done: "Готово",
  error: "Ошибка",
};
