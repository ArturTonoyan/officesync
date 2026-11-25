import { useEffect } from "react";
import { cn } from "@utils/cn";

export type ObjectInfo = {
  title: string;
  subtitle?: string;
  rows?: { label: string; value: string }[];
  screenX: number;
  screenY: number;
};

type Props = {
  info: ObjectInfo | null;
  onClose: () => void;
};

function ObjectInfoPopup({ info, onClose }: Props) {
  useEffect(() => {
    if (!info) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [info, onClose]);

  if (!info) return null;

  return (
    <div
      className={cn(
        "fixed bottom-14 right-4 z-[140] w-[240px] rounded-sm border border-line bg-white/95 p-3 shadow-card backdrop-blur-sm",
      )}
      role="dialog"
      aria-label={info.title}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-fg">
            {info.title}
          </p>
          {info.subtitle && (
            <p className="mt-0.5 text-[11px] font-medium text-fg-secondary">
              {info.subtitle}
            </p>
          )}
        </div>
        <button
          type="button"
          className="shrink-0 cursor-pointer text-[12px] font-semibold text-fg-muted hover:text-fg"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ✕
        </button>
      </div>
      {info.rows && info.rows.length > 0 && (
        <dl className="space-y-1.5">
          {info.rows.map((row) => (
            <div
              key={row.label}
              className="flex justify-between gap-3 text-[11px]"
            >
              <dt className="text-fg-muted">{row.label}</dt>
              <dd className="max-w-[130px] truncate text-right font-semibold text-fg">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export default ObjectInfoPopup;
