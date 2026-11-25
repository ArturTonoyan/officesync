import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FurnishRoomsDto } from './dto/furnish-rooms.dto';
import { ParseEditDto } from './dto/parse-edit.dto';

export type FurnishAddItem = {
  kind: string;
  count: number;
  placement: 'wall' | 'corner' | 'center' | 'around-center';
};

export type FurnishRoomResult = {
  roomId: string;
  add: FurnishAddItem[];
};

@Injectable()
export class LayoutService {
  private readonly logger = new Logger(LayoutService.name);

  constructor(private readonly configService: ConfigService) {}

  private ollamaConfig() {
    const baseUrl = (
      this.configService.get<string>('OLLAMA_BASE_URL') ||
      'http://127.0.0.1:11434'
    ).replace(/\/$/, '');
    const model =
      this.configService.get<string>('OLLAMA_MODEL') ||
      'huihui_ai/qwen2.5-abliterate:7b';
    return { baseUrl, model };
  }

  async status() {
    const { baseUrl, model } = this.ollamaConfig();
    try {
      const response = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(2500),
      });
      if (!response.ok) {
        return { available: false, model, baseUrl };
      }
      return { available: true, model, baseUrl };
    } catch {
      return { available: false, model, baseUrl };
    }
  }

  async furnishRooms(dto: FurnishRoomsDto) {
    const { baseUrl, model } = this.ollamaConfig();
    const catalogKinds = new Set(dto.catalog.map((c) => c.kind));
    const catalogText = dto.catalog
      .slice(0, 120)
      .map((c) => `- ${c.kind} | ${c.label}${c.category ? ` [${c.category}]` : ''}`)
      .join('\n');

    const roomsText = dto.rooms
      .map(
        (r) =>
          `id=${r.id}; name=${r.name}; role=${r.role}; areaM2=${r.areaM2.toFixed(1)}; already=[${r.existingKinds.join(', ')}]`,
      )
      .join('\n');

    const prefs = dto.preferences || {};
    const systemPrompt = [
      'Ты планировщик мебели офиса OfficeSync.',
      'Верни ТОЛЬКО валидный JSON без markdown и без пояснений.',
      'Не указывай координаты x/y — только kind, count и placement.',
      'placement: wall | corner | center | around-center.',
      'kind — строго из каталога.',
      'Не дублируй то, что уже есть в already (те же kind), если хватает.',
      'Для meeting/conference: доска/флипчарт, экран или TV, проектор при необходимости, стулья вокруг стола, телефон конференц, 1–2 растения в углах.',
      'Для lounge: мягкая мебель, столик, растения в углах.',
      'Для reception: вешалка/банкетка если нет, растение.',
      'Для pantry: кофемашина/мини-холодильник/диспенсер воды по каталогу.',
      'Для work/private: растения в свободных углах, шкаф по необходимости.',
      'Для corridor: минимум, можно растение у угла, без столов.',
      'count разумный под площадь (не перегружай).',
    ].join(' ');

    const userPrompt = `Предпочтения: morePlants=${Boolean(prefs.morePlants)}, allowExtra=${prefs.allowExtraFurniture !== false}, moreFocus=${Boolean(prefs.moreFocusBooths)}

Комнаты:
${roomsText}

Каталог (kind | label):
${catalogText}

Формат ответа:
{"rooms":[{"roomId":"...","add":[{"kind":"office/flipchart","count":1,"placement":"wall"}]}],"notes":"..."}`;

    let content = '';
    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(45000),
        body: JSON.stringify({
          model,
          stream: false,
          format: 'json',
          options: { temperature: 0.15, num_predict: 1800 },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Ollama furnish failed status=${response.status}: ${errorText}`,
        );
        throw new ServiceUnavailableException(
          `Ollama недоступна: ${response.status}`,
        );
      }

      const data = await response.json();
      content = (data?.message?.content as string) || '';
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error(`Ollama furnish error: ${error?.message || error}`);
      throw new ServiceUnavailableException(
        'Не удалось связаться с Ollama',
      );
    }

    const parsed = this.parseFurnishJson(content);
    const rooms: FurnishRoomResult[] = (parsed.rooms || [])
      .map((room) => ({
        roomId: String(room.roomId || ''),
        add: (room.add || [])
          .map((item) => ({
            kind: String(item.kind || ''),
            count: Math.max(0, Math.min(20, Number(item.count) || 0)),
            placement: this.normalizePlacement(item.placement),
          }))
          .filter(
            (item) =>
              item.kind &&
              item.count > 0 &&
              catalogKinds.has(item.kind),
          ),
      }))
      .filter((r) => r.roomId);

    return {
      source: 'ollama' as const,
      model,
      rooms,
      notes: typeof parsed.notes === 'string' ? parsed.notes : '',
    };
  }

  async parseEdit(dto: ParseEditDto) {
    const { baseUrl, model } = this.ollamaConfig();
    const scope = dto.scope;

    const catalogItems =
      dto.catalog?.length
        ? dto.catalog
        : (dto.catalogKinds || []).map((kind) => ({ kind, label: kind }));
    const catalogSet = new Set(
      catalogItems.map((c) => c.kind).filter(Boolean),
    );
    const catalogText = catalogItems
      .slice(0, 90)
      .map((c) => `- ${c.kind} | ${c.label || c.kind}`)
      .join('\n');

    const scopeText =
      scope.type === 'room'
        ? `scope=room id=${scope.roomId} name=${scope.roomName || ''}`
        : scope.type === 'selection'
          ? `scope=selection items=${JSON.stringify(scope.items || [])}`
          : 'scope=global (весь этаж)';

    const existing = (dto.existingFurniture || []).slice(0, 120);
    const existingText = existing.length
      ? existing
          .map(
            (f) =>
              `- id=${f.id} kind=${f.kind} rot=${f.rotation ?? 0}${
                f.label ? ` (${f.label})` : ''
              }`,
          )
          .join('\n')
      : '(пусто — в scope нет мебели)';

    const systemPrompt = [
      'Ты редактор плана офиса OfficeSync.',
      'Верни ТОЛЬКО JSON без markdown.',
      'Не пиши координаты x/y.',
      'Учитывай scope: room — только эта комната; selection — только выделенные объекты; global — весь этаж.',
      'Список existingFurniture — реальные объекты в scope; используй их kind/ids для правок.',
      'Допустимые type:',
      'add_furniture {kind,count,placement: wall|corner|center}',
      'remove_furniture {kind?} или {ids?}',
      'remove_selection',
      'move_selection {dx,dy} или {toward} — сдвиг; для room без выделения двигает всю мебель комнаты (можно kind для фильтра)',
      'rotate_furniture {kind?} {ids?} {degrees?} {faceToward: desk|flip} — поворот; «стулья к столу» → faceToward=desk и kind со стулом',
      'clear_room_furniture',
      'unsupported {reason}',
      'kind строго из каталога или из existingFurniture (поле kind, не label).',
      'Синонимы: ПК/компьютер/ноутбук/монитор → office/desk-dual-monitor; доска/флипчарт → office/whiteboard-wall или office/flipchart; проектор → office/projector + office/projector-screen; TV/экран → office/mobile-tv или office/tv-stand; стул/кресло → office/mesh-task-chair или kind из existing.',
      'НЕ используй move_selection для поворота/разворота — только rotate_furniture.',
      'НЕ добавляй растения (round-planter / plant-*), если пользователь не просил растения/цветы/зелень.',
      'Если просят оборудование в переговорную — доски, проекторы, экраны, ПК/столы с мониторами, стулья; не подменяй это цветами в углах.',
      'placement: доски/экраны/TV — wall; проектор — wall (перед экраном, не в центр стола); ПК/столы — wall; растения — corner.',
      'Если запрос неоднозначен — одна action unsupported с reason-вопросом.',
    ].join(' ');

    const userPrompt = `${scopeText}
areaM2=${dto.areaM2 ?? 'n/a'}

Мебель в scope (existingFurniture):
${existingText}

Каталог (kind | label):
${catalogText}

Запрос пользователя: ${dto.text}

Пример «переверни стулья к столу»:
{"actions":[{"type":"rotate_furniture","kind":"chair","faceToward":"desk"}],"reply":"Разверну все стулья лицом к ближайшему столу"}

Пример для оборудования в переговорной:
{"actions":[{"type":"add_furniture","kind":"office/whiteboard-wall","count":1,"placement":"wall"},{"type":"add_furniture","kind":"office/projector-screen","count":1,"placement":"wall"},{"type":"add_furniture","kind":"office/projector","count":1,"placement":"wall"},{"type":"add_furniture","kind":"office/desk-dual-monitor","count":2,"placement":"wall"}],"reply":"Добавлю доску, проектор с экраном и 2 рабочих места с мониторами"}

Формат: {"actions":[...],"reply":"Кратко по-русски что сделаешь"}`;

    let content = '';
    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(45000),
        body: JSON.stringify({
          model,
          stream: false,
          format: 'json',
          options: { temperature: 0.05, num_predict: 1100 },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });
      if (!response.ok) {
        throw new ServiceUnavailableException(
          `Ollama недоступна: ${response.status}`,
        );
      }
      const data = await response.json();
      content = (data?.message?.content as string) || '';
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error(`Ollama parse-edit error: ${error?.message || error}`);
      throw new ServiceUnavailableException(
        'Не удалось связаться с Ollama',
      );
    }

    const parsed = this.parseJsonObject(content, 'parse-edit') as {
      actions?: Array<Record<string, unknown>>;
      reply?: string;
    };

    const allowed = new Set([
      'add_furniture',
      'remove_furniture',
      'remove_selection',
      'move_selection',
      'rotate_furniture',
      'clear_room_furniture',
      'unsupported',
    ]);

    const existingKinds = new Set(
      (dto.existingFurniture || []).map((f) => f.kind).filter(Boolean),
    );

    const mappedActions: Array<Record<string, unknown>> = (parsed.actions || [])
      .map((raw) => {
        const type = String(raw.type || '');
        if (!allowed.has(type)) {
          return { type: 'unsupported', reason: `Неизвестный тип: ${type}` };
        }
        if (type === 'add_furniture') {
          let kind = String(raw.kind || '');
          kind = this.resolveCatalogKind(kind, catalogSet, catalogItems);
          if (catalogSet.size && kind && !catalogSet.has(kind)) {
            return {
              type: 'unsupported',
              reason: `Нет в каталоге: ${kind}`,
            };
          }
          return {
            type,
            kind,
            count: Math.max(1, Math.min(12, Number(raw.count) || 1)),
            placement: this.normalizePlacement(raw.placement),
          };
        }
        if (type === 'remove_furniture') {
          return {
            type,
            kind: raw.kind ? String(raw.kind) : undefined,
            ids: Array.isArray(raw.ids)
              ? raw.ids.map((x) => String(x))
              : undefined,
          };
        }
        if (type === 'move_selection') {
          return {
            type,
            dx: raw.dx != null ? Number(raw.dx) : undefined,
            dy: raw.dy != null ? Number(raw.dy) : undefined,
            toward: raw.toward ? String(raw.toward) : undefined,
            kind: raw.kind ? String(raw.kind) : undefined,
          };
        }
        if (type === 'rotate_furniture') {
          let kind = raw.kind ? String(raw.kind) : undefined;
          // «chair»/«стул» оставляем как фильтр по классу, не сужаем до одного kind
          if (
            kind &&
            !/^(chair|стул|кресл|stool|desk|table|стол)/i.test(kind)
          ) {
            const resolved = this.resolveCatalogKind(
              kind,
              new Set([...catalogSet, ...existingKinds]),
              [
                ...catalogItems,
                ...[...existingKinds].map((k) => ({ kind: k, label: k })),
              ],
            );
            kind = resolved || kind;
          } else if (kind && /стул|кресл/i.test(kind)) {
            kind = 'chair';
          } else if (kind && /стол/i.test(kind)) {
            kind = 'desk';
          }
          const faceRaw = String(raw.faceToward || '').toLowerCase();
          const faceToward =
            /desk|table|стол|nearest/.test(faceRaw)
              ? 'desk'
              : /flip|180|перевер|развер/.test(faceRaw)
                ? 'flip'
                : faceRaw
                  ? 'desk'
                  : undefined;
          return {
            type,
            kind,
            ids: Array.isArray(raw.ids)
              ? raw.ids.map((x) => String(x))
              : undefined,
            degrees:
              raw.degrees != null && !Number.isNaN(Number(raw.degrees))
                ? Number(raw.degrees)
                : undefined,
            faceToward,
          };
        }
        if (type === 'unsupported') {
          return { type, reason: String(raw.reason || 'Уточните запрос') };
        }
        return { type };
      })
      .filter(Boolean);

    let actions = this.mergeInferredEquipment(
      dto.text || '',
      mappedActions,
      catalogSet,
    );
    actions = this.mergeInferredRotation(dto.text || '', actions);

    let reply = typeof parsed.reply === 'string' ? parsed.reply : '';
    const replyLooksLikePlants = /растен|цвет|кашпо/i.test(reply);
    if (
      !reply ||
      (replyLooksLikePlants &&
        this.textWantsEquipment(dto.text || '') &&
        !this.textWantsPlants(dto.text || ''))
    ) {
      const adds = actions.filter((a) => a.type === 'add_furniture') as Array<{
        kind: string;
        count: number;
      }>;
      if (adds.length) {
        reply = `Добавлю: ${adds
          .map((a) => `${a.count}× ${a.kind.replace(/^office\//, '')}`)
          .join(', ')}`;
      }
    }
    if (
      (!reply || /сдвиг|сдвин/i.test(reply)) &&
      actions.some((a) => a.type === 'rotate_furniture')
    ) {
      reply = 'Разверну стулья лицом к ближайшему столу';
    }

    return {
      source: 'ollama' as const,
      model,
      actions,
      reply,
    };
  }

  /** «переверни стулья к столу» → rotate_furniture, даже если модель вернула move_selection */
  private mergeInferredRotation(
    text: string,
    actions: Array<Record<string, unknown>>,
  ): Array<Record<string, unknown>> {
    const t = text.toLowerCase();
    const wantsRotate =
      /(переверн|разверн|поверн|face|orient|к столу|к стол|к деску|toward)/i.test(
        t,
      ) && /(стул|кресл|chair)/i.test(t);
    if (!wantsRotate) return actions;

    const hasRotate = actions.some((a) => a.type === 'rotate_furniture');
    if (hasRotate) return actions;

    const withoutMove = actions.filter((a) => a.type !== 'move_selection');
    const faceToward = /стол|desk|table|деск/.test(t) ? 'desk' : 'flip';
    return [
      ...withoutMove,
      { type: 'rotate_furniture', kind: 'chair', faceToward },
    ];
  }

  private isPlantKind(kind: string) {
    const k = kind.toLowerCase();
    return /plant|planter|кашпо/.test(k);
  }

  private textWantsPlants(text: string) {
    return /растен|цветк|кашпо|зелен|вазон/.test(text.toLowerCase());
  }

  private textWantsEquipment(text: string) {
    return /оборуд|техник|пк\b|компьют|ноутбук|монитор|доск|флип|проектор|экран|тв\b|телевиз|камер|телефон|микрофон|дисплей|панель/.test(
      text.toLowerCase(),
    );
  }

  private resolveCatalogKind(
    kind: string,
    catalogSet: Set<string>,
    catalogItems: Array<{ kind: string; label?: string }>,
  ): string {
    if (!kind) return kind;
    if (catalogSet.has(kind)) return kind;
    const lower = kind.toLowerCase();
    const bySuffix = [...catalogSet].find(
      (k) =>
        k === lower ||
        k.endsWith(`/${lower}`) ||
        k.split('/').pop() === lower.replace(/^office\//, ''),
    );
    if (bySuffix) return bySuffix;
    const byLabel = catalogItems.find(
      (c) =>
        (c.label || '').toLowerCase() === lower ||
        (c.label || '').toLowerCase().includes(lower),
    );
    return byLabel?.kind || kind;
  }

  private countFromText(
    text: string,
    patterns: RegExp[],
    fallback: number,
  ): number {
    const t = text.toLowerCase();
    for (const re of patterns) {
      const m =
        t.match(new RegExp(`(\\d+)\\s*[xх×]?\\s*(?:${re.source})`, 'i')) ||
        t.match(new RegExp(`(?:${re.source})\\D{0,12}(\\d+)`, 'i'));
      if (m) {
        const n = Number(m[1]);
        if (Number.isFinite(n) && n > 0) return Math.min(8, n);
      }
    }
    if (/больше|ещё|еще|дополнит|побольше/.test(t)) {
      return Math.max(fallback, 2);
    }
    return fallback;
  }

  /** Если модель снова выдала только цветы — подставляем оборудование по тексту */
  private mergeInferredEquipment(
    text: string,
    actions: Array<Record<string, unknown>>,
    catalogSet: Set<string>,
  ): Array<Record<string, unknown>> {
    const inferred = this.inferEquipmentActions(text, catalogSet);
    if (!inferred.length) {
      if (!this.textWantsPlants(text)) {
        return actions.filter(
          (a) =>
            !(
              a.type === 'add_furniture' &&
              this.isPlantKind(String(a.kind || ''))
            ),
        );
      }
      return actions;
    }

    const adds = actions.filter((a) => a.type === 'add_furniture');
    const others = actions.filter((a) => a.type !== 'add_furniture');
    const onlyPlants =
      adds.length === 0 ||
      adds.every((a) => this.isPlantKind(String(a.kind || '')));
    const wantsEquip = this.textWantsEquipment(text);

    if (wantsEquip && onlyPlants) {
      const keepPlants = this.textWantsPlants(text)
        ? adds.filter((a) => this.isPlantKind(String(a.kind || '')))
        : [];
      return [...others, ...inferred, ...keepPlants];
    }

    const merged = [...others];
    const existingKinds = new Set(
      adds.map((a) => String(a.kind || '')).filter(Boolean),
    );
    for (const a of adds) {
      if (
        wantsEquip &&
        !this.textWantsPlants(text) &&
        this.isPlantKind(String(a.kind || ''))
      ) {
        continue;
      }
      merged.push(a);
    }
    for (const item of inferred) {
      const kind = String(item.kind || '');
      if (!kind || existingKinds.has(kind)) continue;
      // не дублировать близкие доски/экраны, если модель уже что-то добавила
      const family = kind.replace(/^office\//, '').split('-')[0];
      const hasFamily = [...existingKinds].some((k) =>
        k.replace(/^office\//, '').startsWith(family),
      );
      if (hasFamily && /whiteboard|flipchart|projector|tv/.test(kind)) {
        continue;
      }
      merged.push(item);
      existingKinds.add(kind);
    }
    return merged;
  }

  private inferEquipmentActions(
    text: string,
    catalogSet: Set<string>,
  ): Array<Record<string, unknown>> {
    if (!this.textWantsEquipment(text)) return [];
    const t = text.toLowerCase();
    const out: Array<Record<string, unknown>> = [];
    const push = (
      kind: string,
      count: number,
      placement: 'wall' | 'corner' | 'center',
    ) => {
      if (catalogSet.size && !catalogSet.has(kind)) return;
      out.push({ type: 'add_furniture', kind, count, placement });
    };

    if (/эвакуац|план\s*эвакуац/.test(t)) {
      push('office/evacuation-map', 1, 'wall');
    }

    if (/огнетуш/.test(t)) {
      push('office/fire-extinguisher', 1, 'corner');
    }

    if (/аптечк/.test(t)) {
      push('office/first-aid', 1, 'wall');
    }

    if (/доск|флип|whiteboard|маркерн/.test(t)) {
      const n = this.countFromText(t, [/доск\w*/, /флип\w*/, /whiteboard/], 1);
      if (/мобильн|флип/.test(t)) {
        push('office/flipchart', n, 'wall');
        push('office/mobile-whiteboard', Math.max(1, n - 1) || 1, 'wall');
      } else {
        push('office/whiteboard-wall', n, 'wall');
        if (n > 1 || /больше|ещё|еще/.test(t)) {
          push('office/flipchart', 1, 'wall');
        }
      }
    }

    if (/проектор/.test(t)) {
      const n = this.countFromText(t, [/проектор\w*/], 1);
      push('office/projector-screen', Math.min(n, 2), 'wall');
      push('office/projector', n, 'wall');
    } else if (/экран/.test(t) && !/растен/.test(t)) {
      push('office/projector-screen', 1, 'wall');
    }

    if (/пк\b|компьют|ноутбук|монитор|рабоч\w*\s*мест/.test(t)) {
      const n = this.countFromText(
        t,
        [/пк\b/, /компьют\w*/, /ноутбук\w*/, /монитор\w*/],
        2,
      );
      push('office/desk-dual-monitor', n, 'wall');
    }

    if (/тв\b|телевиз|video.?wall|вкс/.test(t)) {
      push('office/mobile-tv', 1, 'wall');
    }

    if (/стул|кресл/.test(t)) {
      const n = this.countFromText(t, [/стул\w*/, /кресл\w*/], 4);
      push('office/meeting-chair', n, 'center');
    }

    if (this.textWantsPlants(t)) {
      const n = this.countFromText(t, [/растен\w*/, /цвет\w*/, /кашпо/], 2);
      push('office/round-planter', n, 'corner');
    }

    return out;
  }

  private normalizePlacement(
    value: unknown,
  ): FurnishAddItem['placement'] {
    const v = String(value || '').toLowerCase();
    if (v === 'corner' || v === 'center' || v === 'around-center') return v;
    return 'wall';
  }

  private parseFurnishJson(raw: string): {
    rooms?: Array<{
      roomId?: string;
      add?: Array<{ kind?: string; count?: number; placement?: string }>;
    }>;
    notes?: string;
  } {
    return this.parseJsonObject(raw, 'furnish') as {
      rooms?: Array<{
        roomId?: string;
        add?: Array<{ kind?: string; count?: number; placement?: string }>;
      }>;
      notes?: string;
    };
  }

  private parseJsonObject(raw: string, label: string): Record<string, unknown> {
    const trimmed = (raw || '').trim();
    try {
      return JSON.parse(trimmed);
    } catch {
      const start = trimmed.indexOf('{');
      const end = trimmed.lastIndexOf('}');
      if (start >= 0 && end > start) {
        try {
          return JSON.parse(trimmed.slice(start, end + 1));
        } catch {
          /* fallthrough */
        }
      }
      this.logger.error(`Invalid Ollama JSON for ${label}`);
      throw new InternalServerErrorException(
        `Ollama вернула невалидный JSON (${label})`,
      );
    }
  }
}
