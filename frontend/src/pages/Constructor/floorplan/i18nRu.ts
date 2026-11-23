/** Словарь UI JBay Floorplan → русский */

export const FP_RU: Record<string, string> = {
  // Tools + shortcuts
  Select: "Выбор",
  Pan: "Перемещение",
  Wall: "Стена",
  Walls: "Стены",
  Room: "Комната",
  Road: "Дорога",
  Door: "Дверь",
  Window: "Окно",
  Furniture: "Мебель",
  Office: "Офис",
  Garden: "Сад",
  Railing: "Ограждение",
  Pool: "Бассейн",
  Balcony: "Балкон",
  None: "Нет",
  Grid: "Сетка",
  Dimensions: "Размеры",
  Rotate: "Поворот",
  Rotation: "Поворот",
  Duplicate: "Дублировать",
  Delete: "Удалить",
  Close: "Закрыть",
  Undo: "Отменить",
  Redo: "Повторить",
  "Undo · Ctrl Z": "Отменить · Ctrl Z",
  "Redo · Ctrl Y": "Повторить · Ctrl Y",
  "Select · V": "Выбор · V",
  "Pan · H": "Перемещение · H",
  "Wall · W": "Стена · W",
  "Room · R": "Комната · R",
  "Road · S": "Дорога · S",
  "Door · D": "Дверь · D",
  "Window · N": "Окно · N",
  "Furniture · F": "Мебель · F",
  "Office · O": "Офис · O",
  "Garden · G": "Сад · G",
  "Duplicate (Ctrl D)": "Дублировать (Ctrl D)",
  "Rotate 90° (E)": "Повернуть на 90° (E)",
  "Fit to view (0)": "Вписать в экран (0)",
  "Zoom in (+)": "Приблизить (+)",
  "Zoom out (-)": "Отдалить (−)",
  "Snapping (hold Alt to bypass)": "Привязка (Alt — отключить)",

  // Status / hints
  "Click to select · drag empty space to pan · scroll to zoom":
    "Клик — выбор · перетащите пустое место — сдвиг · колёсико — масштаб",
  "Drag to pan · scroll to zoom": "Перетащите — сдвиг · колёсико — масштаб",
  "Drag to move · Del to delete · Esc to deselect":
    "Перетащите — переместить · Del — удалить · Esc — снять выделение",
  "Click to start a wall · snaps to grid, corners & walls":
    "Кликните, чтобы начать стену · привязка к сетке, углам и стенам",
  "Click to continue · Shift: 15° steps · Alt: free · Esc / right-click to finish":
    "Клик — продолжить · Shift: шаг 15° · Alt: свободно · Esc / ПКМ — завершить",
  "Drag to draw a rectangular room · or click to draw a polygon":
    "Протяните прямоугольную комнату · или кликайте углы многоугольника",
  "Click to add corners · click the first corner to close · Enter to finish":
    "Кликайте углы · клик по первому углу или Enter — замкнуть",
  "Click to start a road · snaps to road ends and onto roads":
    "Кликните, чтобы начать дорогу · привязка к концам и дорогам",
  "Click to continue · end on another road for a junction · Esc / right-click to finish":
    "Клик — продолжить · конец на другой дороге — перекрёсток · Esc / ПКМ — готово",
  "Hover a wall and click to place a door":
    "Наведите на стену и кликните, чтобы поставить дверь",
  "Hover a wall and click to place a window":
    "Наведите на стену и кликните, чтобы поставить окно",
  "Open area, e.g. a garden": "Открытая зона, например сад",
  "Balcony: railings on the open sides":
    "Балкон: ограждения на открытых сторонах",
  "Swimming pool: draw the water's edge":
    "Бассейн: обрисуйте контур воды",
  "Build walls around the room": "Стены вокруг комнаты",
  "Make it a swimming pool": "Сделать бассейном",
  "Not a pool": "Не бассейн",

  // Inspector / fields
  Name: "Название",
  Length: "Длина",
  Width: "Ширина",
  Depth: "Глубина",
  Thickness: "Толщина",
  Material: "Материал",
  Colour: "Цвет",
  Color: "Цвет",
  Type: "Тип",
  Offset: "Смещение",
  Hinge: "Петля",
  Swing: "Открытие",
  Edges: "Края",
  Left: "Слева",
  Right: "Справа",
  Top: "Сверху",
  Bottom: "Снизу",
  Single: "Одинарная",
  Double: "Двойная",
  Sliding: "Раздвижная",
  Solid: "Сплошная",
  Glass: "Стекло",
  Frosted: "Матовое",
  Mirror: "Зеркало",
  Wood: "Дерево",
  White: "Белый",
  Plain: "Простой",
  Carpet: "Ковёр",
  Tile: "Плитка",
  Stone: "Камень",
  Concrete: "Бетон",
  Grass: "Трава",
  Asphalt: "Асфальт",
  Floor: "Пол",
  Floors: "Этажи",
  Building: "Здание",
  "Floor settings": "Настройки этажа",
  "Custom colour": "Свой цвет",
  "Ground floor": "1 этаж",
  "Add floor above": "Добавить этаж выше",
  "Add floor below": "Добавить этаж ниже",
  "Duplicate floor": "Дублировать этаж",
  "Delete floor": "Удалить этаж",
  "Move up": "Выше",
  "Move down": "Ниже",
  "Swap with the floor above": "Поменять с этажом выше",
  "Swap with the floor below": "Поменять с этажом ниже",
  "Copy this floor's layout to a new floor on top":
    "Скопировать планировку на новый этаж сверху",
  "No floor plan yet": "Плана пока нет",
  "Untitled plan": "Без названия",
  "Height (floor to floor)": "Высота этажа",
  "Pool finish": "Отделка бассейна",
  "Glass sides": "Стеклянные борта",
  Corners: "Углы",
  Raised: "Приподнят",
  Sunk: "Утоплен",
  "Standing on the floor": "На полу",
  "Sunk into the floor": "В полу",
  "Shallow end": "Мелкий край",
  "Deep end": "Глубокий край",
  "Deep end side": "Сторона глубины",
  "Blue mosaic": "Синяя мозаика",
  "Dark slate": "Тёмный сланец",
  "White plaster": "Белая штукатурка",
  Pill: "Скругление",
  Lanes: "Полосы",
  Lines: "Разметка",
  Dashed: "Пунктир",
  Pavement: "Тротуар",
  Island: "Остров",
  cm: "см",
  m: "м",

  // 3D
  Cutaway: "Разрез",
  Exploded: "Раздвинуто",
  Stacked: "Слоями",
  "Floor view": "Этаж",

  // Categories
  Living: "Гостиная",
  Dining: "Столовая",
  Bedroom: "Спальня",
  Kitchen: "Кухня",
  Bath: "Санузел",
  Plants: "Растения",
  Desks: "Столы",
  "Screens & dividers": "Перегородки",
  Chairs: "Стулья",
  Meeting: "Переговорные",
  "Focus & lounge": "Зоны фокуса",
  Storage: "Хранение",
  Equipment: "Оборудование",

  // Built-in furniture
  Sofa: "Диван",
  Loveseat: "Двухместный диван",
  Armchair: "Кресло",
  "Coffee table": "Журнальный стол",
  TV: "ТВ",
  Rug: "Ковёр",
  "Dining table": "Обеденный стол",
  "Round table": "Круглый стол",
  Chair: "Стул",
  "Double bed": "Двуспальная кровать",
  "King bed": "Кровать king-size",
  "Single bed": "Односпальная кровать",
  Nightstand: "Тумбочка",
  Wardrobe: "Шкаф",
  Desk: "Письменный стол",
  "Kitchen run": "Кухонный гарнитур",
  Fridge: "Холодильник",
  Bathtub: "Ванна",
  Shower: "Душ",
  Toilet: "Унитаз",
  Vanity: "Тумба с раковиной",
  Stairs: "Лестница",
  Elevator: "Лифт",
  Palm: "Пальма",
  Monstera: "Монстера",
  "Olive tree": "Олива",
  "Leafy plant": "Растение",
  "Ornamental grass": "Декоративная трава",

  // Office pack
  "Desk with monitor": "Стол с монитором",
  "Desk with two monitors": "Стол с двумя мониторами",
  "Height-adjustable desk": "Стол с регулировкой высоты",
  "L-shaped corner desk": "Угловой L-стол",
  "Hot desk": "Гибкое рабочее место",
  "Bench desk for 2": "Бенч на 2 места",
  "Bench desk for 4": "Бенч на 4 места",
  "Bench desk for 6": "Бенч на 6 мест",
  "Reception desk": "Ресепшен",
  "Desk divider": "Разделитель стола",
  "Free-standing partition": "Перегородка",
  "Acoustic room screen": "Акустический экран",
  "Glass partition": "Стеклянная перегородка",
  "Ergonomic task chair": "Эргономичное кресло",
  "Executive chair": "Кресло руководителя",
  "Meeting chair": "Стул для переговоров",
  "Visitor chair": "Гостевой стул",
  "Bar stool": "Барный стул",
  "Lounge armchair": "Кресло для отдыха",
  "Meeting table, 4 seats": "Стол на 4 места",
  "Meeting table, 6 seats": "Стол на 6 мест",
  "Meeting table, 8 seats": "Стол на 8 мест",
  "Boardroom table, 12 seats": "Стол на 12 мест",
  "Round meeting table": "Круглый переговорный стол",
  "High table with stools": "Высокий стол со стульями",
  "Video conference screen": "Экран ВКС",
  "Mobile whiteboard": "Мобильная доска",
  "Phone booth": "Телефонная кабина",
  "Meeting pod": "Переговорная кабина",
  "High-back acoustic sofa": "Акустический диван",
  "Pedestal drawers": "Тумба с ящиками",
  Lockers: "Локеры",
  "Filing cabinet": "Картотека",
  "Low shelving": "Низкий стеллаж",
  "Multifunction printer": "МФУ",
  "Server rack": "Серверная стойка",
  "Water cooler": "Кулер",
  "Coffee station": "Кофе-поинт",
  "Planter box": "Кашпо",
  "Tall office plant": "Высокое растение",

  // Extra office furniture
  "Compact desk": "Компактный стол",
  "Executive desk": "Стол руководителя",
  "Facing desks for 2": "Столы лицом к лицу",
  "Wall-mounted desk": "Пристенный стол",
  "Collaboration island": "Коллаборативный остров",
  "Low cubicle wall": "Низкая перегородка",
  "Tall cubicle wall": "Высокая перегородка",
  "L-shaped privacy screen": "Г-образный экран",
  Pouf: "Пуф",
  "Bench seat": "Банкетка",
  "2-seat sofa": "Диван 2 места",
  "3-seat sofa": "Диван 3 места",
  Ottoman: "Оттоманка",
  "Flip chart": "Флипчарт",
  Lectern: "Трибуна",
  "Side table": "Приставной столик",
  "Lounge seating set": "Лаунж-зона",
  "TV on stand": "ТВ на тумбе",
  "Waiting bench": "Скамья ожидания",
  "High-back privacy chair": "Кресло с высокой спинкой",
  "Rest daybed": "Кушетка для отдыха",
  "Focus booth": "Кабина для фокуса",
  "Tall cabinet": "Высокий шкаф",
  Credenza: "Креденца",
  Bookshelf: "Книжный стеллаж",
  "Coat rack": "Вешалка",
  "Recycling station": "Станция сортировки",
  "Trash bin": "Урна",
  "Paper shredder": "Шредер",
  "Mobile TV cart": "Мобильный ТВ",
  "Charging lockers": "Шкафчики для зарядки",
  "Vending machine": "Вендинг",
  "Large-format plotter": "Плоттер",
  "Fire extinguisher": "Огнетушитель",
  "First aid cabinet": "Аптечка",
  "Wall clock": "Настенные часы",
  "Round planter": "Круглое кашпо",
  "Plant shelf": "Стеллаж с растениями",
  "Floor vase plant": "Напольное растение",

  "Desk with triple monitors": "Стол с тремя мониторами",
  "Peninsula desk": "Стол-полуостров",
  "Shared desk for 4": "Общий стол на 4",
  "Laptop bar": "Бар для ноутбуков",
  "Dual sit-stand desk": "Двойной стол с регулировкой высоты",
  "Reception island": "Остров ресепшена",
  "Glass partition with door": "Стеклянная перегородка с дверью",
  "Zigzag acoustic screen": "Зигзаг-экран",
  "Mobile divider on wheels": "Мобильная перегородка",
  "Stacking chair": "Стул штабелируемый",
  "Cantilever chair": "Консольный стул",
  "Corner sofa": "Угловой диван",
  "Bean bag": "Кресло-мешок",
  "Nesting stools set": "Набор табуретов",
  "Oval meeting table": "Овальный переговорный стол",
  "Huddle table": "Стол для быстрых встреч",
  "Training desk row": "Учебный ряд столов",
  "Projector screen": "Экран проектора",
  Projector: "Проектор",
  "Conference phone": "Конференц-телефон",
  "Nap pod": "Капсула для отдыха",
  "Library nook": "Читальный уголок",
  "Soft booth for 2": "Мягкая кабина на 2",
  "Breakout game table": "Игровой стол",
  "Archive shelving": "Архивный стеллаж",
  "Mobile pedestal": "Мобильная тумба",
  "Office wardrobe": "Офисный гардероб",
  Safe: "Сейф",
  "Mail slots wall": "Почтовые ячейки",
  "Bag lockers": "Шкафчики для сумок",
  "Large MFP with trays": "Большое МФУ",
  "Label printer": "Принтер этикеток",
  "Document scanner": "Сканер документов",
  "Wide server rack": "Широкая серверная стойка",
  "Network cabinet": "Сетевой шкаф",
  "UPS battery unit": "ИБП",
  "Router / switch shelf": "Полка под роутер",
  "Coffee machine": "Кофемашина",
  "Tea / kettle station": "Чайная станция",
  "Mini fridge": "Мини-холодильник",
  Microwave: "Микроволновка",
  "Office dishwasher": "Посудомойка",
  "Kitchenette sink": "Мойка кухни",
  "Bottle water dispenser": "Кулер на бутыли",
  "Ice maker": "Льдогенератор",
  "Sanitizer stand": "Стойка санитайзера",
  "AED cabinet": "Шкаф AED",
  "Security monitor desk": "Стол охраны",
  "Access control terminal": "Терминал доступа",
  "Time clock": "Терминал учёта времени",
  "Laptop charging cart": "Тележка для ноутбуков",
  "3D printer": "3D-принтер",
  Laminator: "Ламинатор",
  "Paper cutter": "Резак для бумаги",
  "Mail cart": "Почтовая тележка",
  "Cleaning cart": "Уборочная тележка",
  "Umbrella stand": "Подставка для зонтов",
  "Bike rack": "Велопарковка",
  "Locker room bench": "Скамья в раздевалке",
  "Floor power pole": "Напольная стойка розеток",
  "Cable management tray": "Кабель-канал",
  "Wall whiteboard": "Настенная доска",
  "Notice board": "Доска объявлений",
  "Flag stand": "Флагшток",
  "Hedge planter": "Живая изгородь в кашпо",
  "Hanging plant": "Подвесное растение",
  "Cactus set": "Набор кактусов",
};

const ATTRS = [
  "title",
  "aria-label",
  "placeholder",
  "data-tooltip",
  "data-tip",
] as const;

/** Длинные фразы раньше коротких — меньше ложных замен */
const FP_RU_ENTRIES = Object.entries(FP_RU).sort(
  (a, b) => b[0].length - a[0].length,
);

function translateUnits(value: string): string {
  return value
    .replace(/m²/g, "м²")
    .replace(/sq\s*m/gi, "м²")
    .replace(/\bcm\b/g, "см")
    .replace(/(\d)\s*m\b/g, "$1 м")
    .replace(/\b(\d+(?:\.\d+)?)\s*m\b/g, "$1 м");
}

export function translateText(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (FP_RU[trimmed]) {
    return value.replace(trimmed, FP_RU[trimmed]);
  }

  let next = trimmed;
  let changed = false;
  for (const [en, ru] of FP_RU_ENTRIES) {
    if (en.length < 2) continue;
    if (next.includes(en)) {
      next = next.split(en).join(ru);
      changed = true;
    }
  }

  const withUnits = translateUnits(next);
  if (withUnits !== next) {
    next = withUnits;
    changed = true;
  }

  if (changed) return value.replace(trimmed, next);
  if (/\d/.test(trimmed) && (/\bm\b/.test(trimmed) || /\bcm\b/.test(trimmed))) {
    const u = translateUnits(trimmed);
    if (u !== trimmed) return value.replace(trimmed, u);
  }
  return null;
}

function translateNode(root: ParentNode | Element) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) texts.push(node as Text);

  for (const text of texts) {
    const parent = text.parentElement;
    if (!parent) continue;
    const tag = parent.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA") continue;
    // не трогаем значения в полях ввода
    if (tag === "INPUT" || tag === "OPTION") continue;
    const next = translateText(text.nodeValue || "");
    if (next != null) text.nodeValue = next;
  }

  if (root instanceof Element || root instanceof Document) {
    const scope = root instanceof Document ? root : root;
    const els =
      scope instanceof Element
        ? [scope, ...Array.from(scope.querySelectorAll("*"))]
        : Array.from(scope.querySelectorAll("*"));
    for (const el of els) {
      for (const attr of ATTRS) {
        const val = el.getAttribute(attr);
        if (!val) continue;
        const next = translateText(val);
        if (next != null) el.setAttribute(attr, next);
      }
    }
  }
}

/** Следит за DOM редактора/вьюера и переводит английский UI на русский */
export function attachFloorplanRussian(root: HTMLElement) {
  const run = () => translateNode(root);
  run();

  // поздние панели каталога / инспектора
  const timers = [50, 200, 600, 1500].map((ms) => window.setTimeout(run, ms));

  const observer = new MutationObserver((mutations) => {
    let needsFull = false;
    for (const m of mutations) {
      if (m.type === "characterData" && m.target.parentElement) {
        const parent = m.target.parentElement;
        if (
          parent.tagName === "INPUT" ||
          parent.tagName === "TEXTAREA" ||
          parent.tagName === "OPTION"
        ) {
          continue;
        }
        const next = translateText(m.target.nodeValue || "");
        if (next != null && next !== m.target.nodeValue) {
          m.target.nodeValue = next;
        }
      }
      if (
        m.type === "attributes" &&
        m.target instanceof Element &&
        m.attributeName
      ) {
        if ((ATTRS as readonly string[]).includes(m.attributeName)) {
          const val = m.target.getAttribute(m.attributeName);
          if (!val) continue;
          const next = translateText(val);
          if (next != null) m.target.setAttribute(m.attributeName, next);
        }
      }
      m.addedNodes.forEach((n) => {
        if (n.nodeType === Node.ELEMENT_NODE) {
          translateNode(n as Element);
          needsFull = true;
        }
        if (n.nodeType === Node.TEXT_NODE) {
          const next = translateText(n.nodeValue || "");
          if (next != null) n.nodeValue = next;
        }
      });
    }
    if (needsFull) {
      // подтянуть data-tip у уже существующих кнопок, если библиотека обновила их позже
      window.requestAnimationFrame(run);
    }
  });
  observer.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRS],
  });
  return () => {
    observer.disconnect();
    timers.forEach((id) => window.clearTimeout(id));
  };
}

export function t(en: string): string {
  return FP_RU[en] || en;
}

export function formatLengthRu(cm: number): string {
  return `${(cm / 100).toFixed(2)} м`;
}
