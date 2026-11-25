import { cn } from "@utils/cn";

/**
 * Разбивает подпись маркера на строки:
 * «Иванов Иван Иванович» → 3 строки ФИО;
 * «Иванов Иван Иванович — кабинет» → ФИО + подпись.
 */
export function splitMarkerLines(label: string | undefined | null): string[] {
  if (!label?.trim()) return [];
  const [main, ...tail] = label.split(/\s+[—–-]\s+/);
  const parts = main.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  if (parts.length >= 3) {
    lines.push(parts[0], parts[1], parts.slice(2).join(" "));
  } else if (parts.length === 2) {
    lines.push(parts[0], parts[1]);
  } else if (parts.length === 1) {
    lines.push(parts[0]);
  }
  const extra = tail.join(" — ").trim();
  if (extra) lines.push(extra);
  return lines;
}

type MarkerBadgeProps = {
  label?: string | null;
  className?: string;
  /** 3D: якорь снизу; 2D: по центру точки */
  variant?: "2d" | "3d";
};

export function MarkerBadge({
  label,
  className,
  variant = "2d",
}: MarkerBadgeProps) {
  const lines = splitMarkerLines(label);
  if (!lines.length) {
    return variant === "3d" ? (
      <span className="rounded-sm bg-tag-green px-2 py-0.5 text-[11px] font-bold text-white">
        •
      </span>
    ) : null;
  }

  return (
    <span
      className={cn(
        "flex max-w-[140px] flex-col rounded-md bg-ink/90 px-1.5 py-1 text-center text-[10px] font-semibold leading-[1.15] tracking-[-0.01em] text-white shadow-soft",
        variant === "3d" && "bg-tag-green text-[11px] font-bold",
        className,
      )}
      title={label || undefined}
    >
      {lines.map((line, i) => (
        <span key={`${i}-${line}`} className="block truncate">
          {line}
        </span>
      ))}
    </span>
  );
}
