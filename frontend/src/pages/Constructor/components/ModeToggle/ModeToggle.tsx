import { cn } from "@utils/cn";

export type ViewMode = "edit" | "2d" | "3d";

type ModeOption = { id: string; label: string };

type Props = {
  mode: string;
  onChange: (mode: string) => void;
  modes?: ModeOption[];
};

const DEFAULT_MODES: ModeOption[] = [
  { id: "2d", label: "2D" },
  { id: "3d", label: "3D" },
];

function ModeToggle({ mode, onChange, modes = DEFAULT_MODES }: Props) {
  return (
    <div
      className="inline-flex gap-0.5 rounded-sm border border-line-strong bg-muted p-[3px]"
      role="group"
      aria-label="Режим карты"
    >
      {modes.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cn(
            "min-w-12 cursor-pointer whitespace-nowrap rounded-md border-none bg-transparent px-3 font-sans text-xs font-semibold text-fg-secondary transition-[background,color] duration-150 ease-in-out",
            "h-8",
            mode === item.id && "bg-ink text-white",
          )}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default ModeToggle;