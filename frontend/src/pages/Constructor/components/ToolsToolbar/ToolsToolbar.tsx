import type { ReactNode } from "react";
import { cn } from "@utils/cn";

export type EditorTool =
  | "select"
  | "wall"
  | "room"
  | "meeting"
  | "workplace"
  | "furniture"
  | "door"
  | "delete";

const TOOLS: {
  id: EditorTool;
  label: string;
  icon: ReactNode;
}[] = [
  {
    id: "select",
    label: "Выбор",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M4 4l7 16 2.5-6.5L20 11z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "wall",
    label: "Стена",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="6" width="18" height="12" rx="1" />
        <path d="M3 12h18M12 6v12" />
      </svg>
    ),
  },
  {
    id: "room",
    label: "Комната",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="4" width="18" height="16" rx="1.5" />
        <path d="M3 9h18" opacity="0.4" />
      </svg>
    ),
  },
  {
    id: "meeting",
    label: "Переговорная",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <ellipse cx="12" cy="12" rx="7" ry="4" />
        <circle cx="7" cy="9" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="17" cy="9" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="7" cy="15" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="17" cy="15" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: "workplace",
    label: "Рабочее место",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="10" r="2.5" />
        <path d="M8 17c1.2-2 2.8-3 4-3s2.8 1 4 3" />
      </svg>
    ),
  },
  {
    id: "furniture",
    label: "Мебель",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="4" y="10" width="16" height="8" rx="1" />
        <path d="M6 10V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2M7 18v2M17 18v2" />
      </svg>
    ),
  },
  {
    id: "door",
    label: "Дверь",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="6" y="3" width="12" height="18" rx="1" />
        <circle cx="14" cy="12" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: "delete",
    label: "Удалить",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M5 7h14M10 11v6M14 11v6M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
      </svg>
    ),
  },
];

type Props = {
  activeTool: EditorTool;
  onChange: (tool: EditorTool) => void;
};

function ToolsToolbar({ activeTool, onChange }: Props) {
  return (
    <div
      className="fixed top-1/2 z-[95] flex -translate-y-1/2 flex-col gap-1 rounded-[14px] border border-line bg-white p-2 shadow-[0_8px_28px_rgba(15,23,42,0.08)] left-[calc(var(--spacing-sidebar)+16px)]"
      role="toolbar"
      aria-label="Инструменты карты"
    >
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          type="button"
          title={tool.label}
          aria-label={tool.label}
          aria-pressed={activeTool === tool.id}
          className={cn(
            "inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-[10px] border-none bg-transparent text-slate-500 transition-[background,color,transform] duration-150 ease-in-out",
            "[&_svg]:h-5 [&_svg]:w-5",
            "hover:bg-slate-100 hover:text-slate-900 active:scale-[0.96]",
            activeTool === tool.id && "!bg-slate-900 !text-white",
            tool.id === "delete" && activeTool === tool.id && "!bg-red-600",
            tool.id === "delete" && "hover:text-red-600",
          )}
          onClick={() => onChange(tool.id)}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}

export default ToolsToolbar;