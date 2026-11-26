import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { Button } from "@components/ui";
import { cn } from "@utils/cn";
import {
  ROLE_KIND,
  ROLE_LABEL,
  freeEquipments,
  freePlaceOffset,
  makeSlotFromEquipment,
  type EquipmentRef,
  type WorkplaceKit,
  type WorkplaceRole,
  type WorkplaceSlot,
  ensureKitForDesk,
  updateKitSlots,
  uid,
} from "../../floorplan/workplaceKit";
import EquipmentPickerModal from "./EquipmentPickerModal";

type Props = {
  open: boolean;
  deskId: string | null;
  deskLabel?: string;
  kits: WorkplaceKit[];
  equipments: EquipmentRef[];
  floorId?: string | null;
  onChangeKits: (kits: WorkplaceKit[]) => void;
  onCopyWorkplace: () => void;
  onClose: () => void;
  copyWarning?: string | null;
  /** Корень workspace — для позиционирования под .fp-inspector */
  hostRef?: RefObject<HTMLElement | null>;
};

const GAP = 10;
/** Fallback, если инспектор ещё не отрисован */
const FALLBACK_TOP = 420;

export default function WorkplaceKitPanel({
  open,
  deskId,
  deskLabel,
  kits,
  equipments,
  floorId,
  onChangeKits,
  onCopyWorkplace,
  onClose,
  copyWarning,
  hostRef,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [anchorStyle, setAnchorStyle] = useState<CSSProperties>({
    top: FALLBACK_TOP,
    right: 14,
    maxHeight: `calc(100% - ${FALLBACK_TOP + 56}px)`,
  });

  useEffect(() => {
    if (!open) return;

    const place = () => {
      const host = hostRef?.current;
      if (!host) return;
      const hostRect = host.getBoundingClientRect();
      const inspector =
        host.querySelector<HTMLElement>(".fp-inspector") ||
        document.querySelector<HTMLElement>(".fp-inspector");

      let top = FALLBACK_TOP;
      if (inspector) {
        const ir = inspector.getBoundingClientRect();
        top = Math.max(80, Math.round(ir.bottom - hostRect.top + GAP));
      }
      const bottomPad = 56;
      const remaining = hostRect.height - top - bottomPad;
      // Если под инспектором мало места — прижимаем к низу справа
      if (remaining < 200) {
        setAnchorStyle({
          top: "auto",
          bottom: bottomPad,
          right: 14,
          maxHeight: Math.min(hostRect.height * 0.42, 360),
          width: 268,
        });
      } else {
        setAnchorStyle({
          top,
          bottom: "auto",
          right: 14,
          maxHeight: remaining,
          width: 268,
        });
      }
    };

    place();
    const t1 = window.setTimeout(place, 50);
    const t2 = window.setTimeout(place, 200);
    const t3 = window.setTimeout(place, 500);
    window.addEventListener("resize", place);

    const host = hostRef?.current;
    const observer =
      host &&
      new MutationObserver(() => {
        window.requestAnimationFrame(place);
      });
    if (host && observer) {
      observer.observe(host, { childList: true, subtree: true });
    }

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.removeEventListener("resize", place);
      observer?.disconnect();
    };
  }, [open, deskId, hostRef, kits]);

  const kit = useMemo(
    () => (deskId ? kits.find((k) => k.deskFurnitureId === deskId) : null),
    [kits, deskId],
  );

  const free = useMemo(
    () => freeEquipments(equipments, kits, floorId),
    [equipments, kits, floorId],
  );

  const eqById = useMemo(() => {
    const m = new Map<string, EquipmentRef>();
    for (const e of equipments) m.set(e.id, e);
    return m;
  }, [equipments]);

  if (!open || !deskId) return null;

  const withKit = (): { nextKits: WorkplaceKit[]; kit: WorkplaceKit } => {
    const { kits: next, kit: k } = ensureKitForDesk(kits, deskId);
    return { nextKits: next, kit: k };
  };

  const currentSlots = kit?.slots || [];

  const addEquipment = (eq: EquipmentRef) => {
    const { nextKits, kit: k } = withKit();
    const live = nextKits.find((x) => x.id === k.id) || k;
    const slot = makeSlotFromEquipment(
      live.id,
      eq,
      (live.slots || []).length,
    );
    onChangeKits(updateKitSlots(nextKits, live.id, [...(live.slots || []), slot]));
    setPickerOpen(false);
  };

  const addEmptyRole = (role: WorkplaceRole) => {
    const { nextKits, kit: k } = withKit();
    const live = nextKits.find((x) => x.id === k.id) || k;
    const id = uid("slot");
    const off = freePlaceOffset((live.slots || []).length);
    const slot: WorkplaceSlot = {
      id,
      role,
      kind: ROLE_KIND[role],
      ox: off.ox,
      oy: off.oy,
      rotation: off.rotation,
      equipmentId: null,
      furnitureId: `wpslot_${live.id}_${id}`,
    };
    onChangeKits(
      updateKitSlots(nextKits, live.id, [...(live.slots || []), slot]),
    );
  };

  const removeSlot = (slotId: string) => {
    if (!kit) return;
    onChangeKits(
      updateKitSlots(
        kits,
        kit.id,
        kit.slots.filter((s) => s.id !== slotId),
      ),
    );
  };

  return (
    <>
      <aside
        className={cn(
          // Справа под .fp-inspector (top/right/maxHeight — inline)
          "absolute z-[60] flex flex-col overflow-hidden rounded-lg border border-line-strong bg-elevated shadow-lg",
        )}
        style={{
          ...anchorStyle,
          backgroundColor: "#ffffff",
        }}
      >
        <header className="flex items-start justify-between gap-2 border-b border-line px-3 py-2.5">
          <div>
            <h3 className="text-[13px] font-semibold text-fg">
              Комплектация рабочего места
            </h3>
            <p className="mt-0.5 text-[11px] text-fg-muted">
              {deskLabel || "Стол"} · оборудование из БД
            </p>
          </div>
          <button
            type="button"
            className="cursor-pointer rounded px-1.5 text-[16px] leading-none text-fg-muted hover:bg-muted"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          <p className="mb-2 rounded-md bg-muted/60 px-2 py-1.5 text-[11px] leading-snug text-fg-muted">
            Добавьте оборудование, затем{" "}
            <span className="font-medium text-fg-secondary">
              перетащите его мышкой
            </span>{" "}
            в любое место на столе.
          </p>

          {currentSlots.length === 0 ? (
            <p className="mb-2 text-[12px] text-fg-muted">
              Пока пусто. Добавьте ПК, монитор, клавиатуру или мышь из БД.
            </p>
          ) : (
            <ul className="mb-3 flex flex-col gap-2">
              {currentSlots.map((slot) => {
                const eq = slot.equipmentId
                  ? eqById.get(slot.equipmentId)
                  : null;
                return (
                  <li
                    key={slot.id}
                    className="rounded-md border border-line bg-muted/40 px-2 py-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-fg">
                          {ROLE_LABEL[slot.role]}
                        </p>
                        <p className="truncate text-[11px] text-fg-muted">
                          {eq
                            ? [eq.name, eq.inventoryNumber]
                                .filter(Boolean)
                                .join(" · ")
                            : "Без инвентаря"}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="cursor-pointer text-[11px] text-[#b32020]"
                        onClick={() => removeSlot(slot.id)}
                      >
                        Снять
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mb-2 flex flex-wrap gap-1.5">
            <Button
              variant="secondary"
              className="h-8 flex-1 text-[12px]"
              onClick={() => setPickerOpen(true)}
            >
              Добавить из БД
            </Button>
          </div>
          <div className="mb-2 flex flex-wrap gap-1">
            {(["pc", "monitor", "keyboard", "mouse"] as WorkplaceRole[]).map(
              (role) => (
                <button
                  key={role}
                  type="button"
                  className="cursor-pointer rounded border border-dashed border-line px-1.5 py-0.5 text-[10px] text-fg-secondary hover:bg-muted"
                  onClick={() => addEmptyRole(role)}
                  title="Слот без инвентарного номера"
                >
                  + {ROLE_LABEL[role]}
                </button>
              ),
            )}
          </div>

          {copyWarning ? (
            <p className="mb-2 rounded bg-[#fff1d6] px-2 py-1.5 text-[11px] text-[#9a5b00]">
              {copyWarning}
            </p>
          ) : null}
        </div>

        <footer className="flex gap-2 border-t border-line px-3 py-2">
          <Button className="h-9 flex-1 text-[12px]" onClick={onCopyWorkplace}>
            Копировать рабочее место
          </Button>
        </footer>
      </aside>

      <EquipmentPickerModal
        open={pickerOpen}
        items={free}
        deskLabel={deskLabel}
        onPick={addEquipment}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
