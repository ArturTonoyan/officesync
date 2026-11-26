/**
 * Наши 2D-kind (officeExtra / autoplan) → kind из @jbaysolutions/floorplan-pack-office/3d.
 * Без маппинга библиотека рисует серый куб-заглушку.
 */
const KIND_3D: Record<string, string> = {
  // столы
  "office/desk-empty": "office/desk-empty",
  "office/desk-dual-monitor": "office/desk-dual",
  "office/desk-triple-monitor": "office/desk-dual",
  "office/compact-desk": "office/hot-desk",
  "office/executive-desk": "office/desk",
  "office/standing-desk": "office/standing-desk",
  "office/sit-stand-dual": "office/standing-desk",
  "office/corner-desk": "office/corner-desk",
  "office/wall-desk": "office/desk",
  "office/facing-desks": "office/bench-2",
  "office/desk-shared-4": "office/bench-4",
  "office/desk-peninsula": "office/desk",
  "office/collab-island": "office/high-table",
  "office/laptop-bar": "office/high-table",
  "office/training-desk": "office/hot-desk",

  // переговоры
  "office/meeting-table-6": "office/meeting-6",
  "office/meeting-table-8": "office/meeting-8",
  "office/meeting-table-10": "office/boardroom-12",
  "office/meeting-round-4": "office/round-meeting",
  "office/meeting-oval": "office/boardroom-12",
  "office/huddle-table": "office/high-table",
  "office/side-table": "office/pedestal",

  // стулья
  "office/mesh-task-chair": "office/task-chair",
  "office/meeting-chair": "office/meeting-chair",
  "office/stacking-chair": "office/visitor-chair",
  "office/cantilever-chair": "office/visitor-chair",
  "office/guest-chairs-pair": "office/visitor-chair",
  "office/privacy-chair": "office/lounge-chair",
  "office/nesting-stools": "office/stool",
  "office/pouf": "office/stool",
  "office/ottoman": "office/stool",
  "office/bean-bag": "office/lounge-chair",

  // мягкая
  "office/sofa-2": "office/acoustic-sofa",
  "office/sofa-3": "office/acoustic-sofa",
  "office/sofa-corner": "office/acoustic-sofa",
  "office/lounge-set": "office/acoustic-sofa",
  "office/lounge-chair": "office/lounge-chair",
  "office/waiting-bench": "office/acoustic-sofa",
  "office/bench-seat": "office/acoustic-sofa",
  "office/daybed": "office/acoustic-sofa",
  "office/soft-booth-2": "office/meeting-pod",

  // AV / доски
  "office/whiteboard-wall": "office/whiteboard",
  "office/mobile-whiteboard": "office/whiteboard",
  "office/glass-board": "office/whiteboard",
  "office/flipchart": "office/whiteboard",
  /** свой пак evacMap3D — зелёная пластина на стене */
  "office/evacuation-map": "office/evacuation-map",
  "office/fire-extinguisher": "office/fire-extinguisher",
  "office/first-aid": "office/first-aid",
  "office/exit-sign": "office/exit-sign",
  "office/exit-arrow": "office/exit-arrow",
  "office/fire-sign": "office/fire-sign",
  "office/notice-board": "office/whiteboard",
  "office/projector-screen": "office/video-screen",
  /** свой пак projector3D — корпус с объективом, не экран */
  "office/projector": "office/projector",
  "office/mobile-tv": "office/video-screen",
  "office/tv-stand": "office/video-screen",
  "office/vc-display-wall": "office/video-screen",
  "office/interactive-display": "office/video-screen",
  "office/vc-camera-bar": "office/video-screen",
  "office/soundbar": "office/video-screen",
  "office/document-camera": "office/printer",
  "office/conference-phone": "office/pedestal",
  "office/av-credenza": "office/filing-cabinet",
  "office/meeting-sideboard": "office/filing-cabinet",
  "office/power-hub-table": "office/pedestal",

  // растения
  "office/round-planter": "office/office-plant",
  "office/floor-vase": "office/office-plant",
  "office/plant-shelf": "office/planter-box",
  "office/office-plant": "office/office-plant",
  "office/planter-box": "office/planter-box",

  // хранение
  "office/tall-cabinet": "office/shelving",
  "office/bookshelf": "office/shelving",
  "office/filing-cabinet-2": "office/filing-cabinet",
  "office/personal-locker": "office/lockers",
  "office/charging-locker": "office/lockers",
  "office/archive-shelves": "office/shelving",
  "office/mobile-pedestal": "office/pedestal",
  "office/wardrobe-office": "office/lockers",
  "office/credenza": "office/filing-cabinet",
  "office/safe": "office/filing-cabinet",
  "office/bag-storage": "office/lockers",
  "office/mailbox-wall": "office/lockers",
  "office/coat-rack": "office/lockers",

  // перегородки
  "office/acoustic-panel": "office/acoustic-screen",
  "office/desk-privacy-panel": "office/desk-divider",
  "office/cubicle-low": "office/desk-divider",
  "office/cubicle-tall": "office/partition",
  "office/corner-screen": "office/acoustic-screen",
  "office/zigzag-screen": "office/acoustic-screen",
  "office/mobile-divider": "office/partition",
  "office/glass-door-partition": "office/glass-partition",

  // pantry / техника
  "office/coffee-machine": "office/coffee-station",
  "office/kettle-station": "office/coffee-station",
  /** свой пак fridge3D — вертикальный холодильник, не тумба */
  "office/mini-fridge": "office/mini-fridge",
  "office/microwave": "office/coffee-station",
  "office/sink-kitchenette": "sink",
  "office/water-dispenser": "office/water-cooler",
  "office/trash-bin": "office/pedestal",
  "office/recycling-station": "office/pedestal",
  "office/shredder": "office/printer",
  "office/printer": "office/printer",
  "office/mfp-large": "office/printer",
  "office/plotter": "office/printer",
  "office/label-printer": "office/printer",
  "office/scanner": "office/printer",
  "office/server-rack": "office/server-rack",
  "office/server-rack-wide": "office/server-rack",
  "office/network-rack": "office/server-rack",
  "office/ups": "office/server-rack",
  "office/router-shelf": "office/shelving",
  "office/vending": "office/coffee-station",
  "office/desk-lamp": "office/pedestal",
  "office/monitor": "office/monitor",
  "office/keyboard": "office/keyboard",
  "office/mouse": "office/mouse",
  "office/underdesk-cpu": "office/underdesk-cpu",
  "office/docking-station": "office/docking-station",
  "office/monitor-arm": "office/monitor",

  // фокус / ресепшен
  "office/focus-booth": "office/phone-booth",
  "office/phone-booth": "office/phone-booth",
  "office/nap-pod": "office/meeting-pod",
  "office/meeting-pod": "office/meeting-pod",
  "office/reception-island": "office/reception",
  "office/library-nook": "office/shelving",
  "office/game-table": "office/high-table",
  "office/lectern": "office/pedestal",
};

const KNOWN_3D = new Set([
  "office/desk",
  "office/desk-dual",
  "office/standing-desk",
  "office/corner-desk",
  "office/hot-desk",
  "office/bench-2",
  "office/bench-4",
  "office/bench-6",
  "office/reception",
  "office/desk-divider",
  "office/partition",
  "office/acoustic-screen",
  "office/glass-partition",
  "office/task-chair",
  "office/executive-chair",
  "office/meeting-chair",
  "office/visitor-chair",
  "office/stool",
  "office/lounge-chair",
  "office/meeting-4",
  "office/meeting-6",
  "office/meeting-8",
  "office/boardroom-12",
  "office/round-meeting",
  "office/high-table",
  "office/video-screen",
  "office/whiteboard",
  "office/phone-booth",
  "office/meeting-pod",
  "office/acoustic-sofa",
  "office/pedestal",
  "office/lockers",
  "office/filing-cabinet",
  "office/shelving",
  "office/printer",
  "office/server-rack",
  "office/water-cooler",
  "office/coffee-station",
  "office/planter-box",
  "office/office-plant",
]);

/** Эвристика по имени kind, если нет точного маппинга */
function guessKind3d(kind: string): string {
  const k = kind.toLowerCase();
  if (KNOWN_3D.has(kind)) return kind;
  if (KIND_3D[kind]) return KIND_3D[kind]!;

  if (/toilet|унитаз|wc/.test(k)) return "toilet";
  if (/bathtub|ванна/.test(k)) return "bathtub";
  if (/shower|душ/.test(k)) return "shower";
  if (/(^|\/)sink|раковина|vanity|мойк/.test(k)) return "sink";
  if (/plant|planter|vase|кашпо/.test(k)) return "office/office-plant";
  if (/chair|кресл|стул/.test(k)) return "office/task-chair";
  if (/sofa|lounge|диван|bench/.test(k)) return "office/acoustic-sofa";
  if (/meeting-table-10|boardroom|oval/.test(k)) return "office/boardroom-12";
  if (/meeting-table-8/.test(k)) return "office/meeting-8";
  if (/meeting-table|meeting-6/.test(k)) return "office/meeting-6";
  if (/round-meeting|meeting-round/.test(k)) return "office/round-meeting";
  if (/desk-empty|пустой.?стол|empty.?desk/.test(k)) return "office/desk-empty";
  if (/keyboard|клавиатур/.test(k)) return "office/keyboard";
  if (/mouse|мыш/.test(k)) return "office/mouse";
  if (/underdesk-cpu|системн.?блок|(^|\/)cpu$/.test(k))
    return "office/underdesk-cpu";
  if (/docking|док-?станц/.test(k)) return "office/docking-station";
  if (/\/monitor$|office\/monitor|monitor-arm/.test(k)) return "office/monitor";
  if (/desk-dual|desk-triple|dual-monitor|triple-monitor/.test(k))
    return "office/desk-dual";
  if (/standing|sit-stand/.test(k)) return "office/standing-desk";
  if (/desk|стол/.test(k)) return "office/desk";
  if (/projector(?!-?screen)|проектор/.test(k) && !/screen|экран/.test(k))
    return "office/projector";
  if (/whiteboard|flipchart|board|доск/.test(k)) return "office/whiteboard";
  if (/tv|screen|projector-screen|display|monitor-wall|экран/.test(k))
    return "office/video-screen";
  if (/booth|pod|focus|phone-booth/.test(k)) return "office/phone-booth";
  if (/locker|coat|wardrobe/.test(k)) return "office/lockers";
  if (/shelf|cabinet|bookshelf|archive/.test(k)) return "office/shelving";
  if (/filing|credenza|pedestal/.test(k)) return "office/filing-cabinet";
  if (/fridge|холодильник|refrigerator/.test(k)) return "office/mini-fridge";
  if (/coffee|kettle|microwave|pantry/.test(k)) return "office/coffee-station";
  if (/water|cooler|кулер/.test(k)) return "office/water-cooler";
  if (/printer|scanner|plotter|mfp|shredder/.test(k)) return "office/printer";
  if (/server|rack|ups|network/.test(k)) return "office/server-rack";
  if (/partition|divider|screen|privacy|cubicle|acoustic/.test(k))
    return "office/acoustic-screen";
  if (/reception/.test(k)) return "office/reception";
  if (/stool|pouf/.test(k)) return "office/stool";

  return "office/pedestal";
}

/** Встроенные kind библиотеки без префикса office/ */
const BUILTIN_3D: Record<string, string> = {
  plant: "office/office-plant",
  palm: "office/office-plant",
  monstera: "office/office-plant",
  "olive-tree": "office/office-plant",
  chair: "office/task-chair",
  armchair: "office/lounge-chair",
  sofa: "office/acoustic-sofa",
  desk: "office/desk",
  table: "office/meeting-4",
  "dining-table": "office/meeting-6",
  "round-table": "office/round-meeting",
  wardrobe: "office/shelving",
  nightstand: "office/pedestal",
  fridge: "office/mini-fridge",
  kitchen: "office/coffee-station",
  counter: "office/coffee-station",
  tv: "office/video-screen",
  // toilet / sink / bathtub / shower — нативные 3D-модели библиотеки, не маппим в тумбу
  bed: "office/acoustic-sofa",
  rug: "office/pedestal",
  stairs: "office/partition",
  elevator: "office/partition",
  grass: "office/planter-box",
};

/** Kind с собственной геометрией в floorplan-elements (не office-pack). */
const NATIVE_3D = new Set([
  "toilet",
  "sink",
  "bathtub",
  "shower",
  "bed",
  "stairs",
  "elevator",
  "rug",
  "grass",
]);

const CUSTOM_3D = new Set([
  "officesync/person",
  "office/evacuation-map",
  "office/projector",
  "office/mini-fridge",
  "office/desk-empty",
  "office/monitor",
  "office/keyboard",
  "office/mouse",
  "office/underdesk-cpu",
  "office/docking-station",
  "office/fire-extinguisher",
  "office/first-aid",
  "office/exit-sign",
  "office/exit-arrow",
  "office/fire-sign",
]);

export function mapKindFor3d(kind: string): string {
  if (!kind) return "office/pedestal";
  // Встроенный `fridge` в floorplan-elements — гладкий ящик; всегда наша модель.
  if (kind === "fridge" || kind === "office/fridge") return "office/mini-fridge";
  if (kind === "office/desk-empty") return "office/desk-empty";
  if (CUSTOM_3D.has(kind)) return kind;
  if (NATIVE_3D.has(kind)) return kind;
  if (BUILTIN_3D[kind]) return BUILTIN_3D[kind]!;
  const mapped = guessKind3d(kind);
  return KNOWN_3D.has(mapped) ||
    CUSTOM_3D.has(mapped) ||
    NATIVE_3D.has(mapped)
    ? mapped
    : "office/pedestal";
}
