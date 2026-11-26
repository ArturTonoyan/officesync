export type AutoPlanTab = "params" | "edit" | "norms";

export type DensityLevel = "low" | "medium" | "high";

export type FurnitureCatalogOption = {
  id: string;
  label: string;
  kind?: string;
};

export type PrivateOfficeRow = {
  /** Ключ строки в форме (не показываем в UI) */
  id: string;
  userId: string;
  userName: string;
  /** null = алгоритм сам выберет комнату */
  roomId: string | null;
  roomName: string | null;
};

export type DbPreviewKind = "user" | "equipment" | "link" | "marker";

export type DbPreviewItem = {
  id: string;
  kind: DbPreviewKind;
  title: string;
  subtitle?: string;
  enabled: boolean;
};

export type ParsedBriefItem = {
  id: string;
  text: string;
  source: "form" | "text";
};

export type GenerationPhase =
  | "idle"
  | "parse"
  | "layout"
  | "validate"
  | "done"
  | "error";

export type PlanVariantId = "A" | "B" | "C";

export type ReportCounts = {
  workstations: number;
  meetingRooms: number;
  conferenceRoom: number;
  privateOffices: number;
  lounge: number;
  reception: number;
  pantry: number;
};

export type EquipmentReport = {
  /** Выбрано в превью «Подтянуть из БД» */
  selected: number;
  /** Уже привязано к комплектациям столов на этаже */
  assignedToKits: number;
  /** Свободно для ручной комплектации */
  freeForKits: number;
  note: string;
};

export type GenerationReport = {
  created: string[];
  skipped: string[];
  requested: ReportCounts;
  placed: ReportCounts;
  equipment: EquipmentReport;
  norms: { id: string; label: string; status: "ok" | "warn" | "error" }[];
};

export const emptyReportCounts = (): ReportCounts => ({
  workstations: 0,
  meetingRooms: 0,
  conferenceRoom: 0,
  privateOffices: 0,
  lounge: 0,
  reception: 0,
  pantry: 0,
});

export const EQUIPMENT_AUTO_NOTE =
  "Оборудование из БД на столы не расставляется автоматически — используйте комплектацию рабочего места";

export type NormViolation = {
  id: string;
  severity: "error" | "warning";
  message: string;
  objectLabel?: string;
};

export type TextEditMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
};

export type AutoPlanFormState = {
  pullUsers: boolean;
  pullEquipment: boolean;
  pullLinks: boolean;
  dbUsers: DbPreviewItem[];
  dbEquipment: DbPreviewItem[];
  dbLinks: DbPreviewItem[];
  workstations: number;
  meetingRooms: number;
  conferenceRoom: number;
  privateOffices: PrivateOfficeRow[];
  lounge: boolean;
  loungeCount: number;
  pantry: boolean;
  reception: boolean;
  selectedFurniture: Record<string, boolean>;
  furnitureLimits: Record<string, number>;
  allowExtraFurniture: boolean;
  strictCatalogOnly: boolean;
  density: DensityLevel;
  morePlants: boolean;
  moreLounge: boolean;
  moreFocusBooths: boolean;
  preferWindowLight: boolean;
  briefText: string;
  parsedItems: ParsedBriefItem[];
};

export const defaultAutoPlanForm = (): AutoPlanFormState => ({
  pullUsers: false,
  pullEquipment: false,
  pullLinks: false,
  dbUsers: [],
  dbEquipment: [],
  dbLinks: [],
  workstations: 0,
  meetingRooms: 0,
  conferenceRoom: 0,
  privateOffices: [],
  lounge: false,
  loungeCount: 1,
  pantry: false,
  reception: false,
  selectedFurniture: {},
  furnitureLimits: {},
  allowExtraFurniture: true,
  strictCatalogOnly: false,
  density: "medium",
  morePlants: false,
  moreLounge: false,
  moreFocusBooths: false,
  preferWindowLight: true,
  briefText: "",
  parsedItems: [],
});
