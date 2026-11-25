import { useState } from "react";
import { cn } from "@utils/cn";

export type View3DColorMode = "color" | "gray";

export type DisplayLayers = {
  showFio: boolean;
  showRoomNames: boolean;
  showPeople: boolean;
  showRoomArea: boolean;
  /** Цветной / серый макет в 3D */
  colorMode: View3DColorMode;
};

export const DEFAULT_DISPLAY_LAYERS: DisplayLayers = {
  showFio: true,
  showRoomNames: true,
  showPeople: true,
  showRoomArea: true,
  colorMode: "color",
};

type Props = {
  value: DisplayLayers;
  onChange: (next: DisplayLayers) => void;
  /** В 3D показываем тумблер «Люди» и режим цвета */
  showPeopleToggle?: boolean;
};

const ROWS: {
  key: Exclude<keyof DisplayLayers, "colorMode">;
  label: string;
  threeDOnly?: boolean;
}[] = [
  { key: "showFio", label: "ФИО на местах" },
  { key: "showRoomNames", label: "Названия комнат" },
  { key: "showRoomArea", label: "Площадь комнат" },
  { key: "showPeople", label: "Люди в 3D", threeDOnly: true },
];

const COLOR_MODES: { id: View3DColorMode; label: string }[] = [
  { id: "color", label: "Цветной" },
  { id: "gray", label: "Серый" },
];

function DisplayLayersMenu({
  value,
  onChange,
  showPeopleToggle = false,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 top-20 z-[110]">
      <button
        type="button"
        className={cn(
          "flex h-9 items-center gap-2 rounded-sm border border-line bg-white px-3 text-[12px] font-semibold tracking-[-0.01em] text-fg shadow-soft",
          "cursor-pointer hover:bg-hover",
          open && "border-ink",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden
        >
          <path d="M4 6h16M4 12h10M4 18h13" strokeLinecap="round" />
          <circle cx="18" cy="12" r="2" fill="currentColor" stroke="none" />
          <circle cx="20" cy="18" r="2" fill="currentColor" stroke="none" />
        </svg>
        Слои
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-sm border border-line bg-white p-2 shadow-card"
          role="menu"
        >
          {showPeopleToggle && (
            <>
              <p className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.06em] text-fg-muted">
                3D вид
              </p>
              <div
                className="mb-2 flex gap-0.5 rounded-sm border border-line bg-muted p-[3px]"
                role="group"
                aria-label="Цвет 3D"
              >
                {COLOR_MODES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(
                      "h-7 flex-1 cursor-pointer rounded-md border-none bg-transparent text-[11px] font-semibold text-fg-secondary transition-[background,color]",
                      value.colorMode === item.id && "bg-ink text-white",
                    )}
                    aria-pressed={value.colorMode === item.id}
                    onClick={() =>
                      onChange({ ...value, colorMode: item.id })
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
          <p className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.06em] text-fg-muted">
            Отображение
          </p>
          {ROWS.filter((row) => !row.threeDOnly || showPeopleToggle).map(
            (row) => {
              const on = value[row.key];
              return (
                <button
                  key={row.key}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={on}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-sm px-2 py-2 text-left text-[12px] font-medium text-fg hover:bg-hover"
                  onClick={() =>
                    onChange({ ...value, [row.key]: !value[row.key] })
                  }
                >
                  <span>{row.label}</span>
                  <span
                    className={cn(
                      "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                      on ? "bg-ink" : "bg-line",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-soft transition-transform",
                        on ? "left-4" : "left-0.5",
                      )}
                    />
                  </span>
                </button>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}

export default DisplayLayersMenu;
