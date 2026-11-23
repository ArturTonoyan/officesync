import { FURNITURE_PRESETS, MAP_ICONS, type MapIconKey } from "../../utils/mapIcons";
import { cn } from "@utils/cn";

type Props = {
  selected: MapIconKey | null;
  onSelect: (key: MapIconKey) => void;
};

function FurniturePalette({ selected, onSelect }: Props) {
  return (
    <div className="fixed bottom-7 z-[95] w-[280px] rounded-[14px] border border-line bg-white p-3 shadow-[0_8px_28px_rgba(15,23,42,0.08)] left-[calc(var(--spacing-sidebar)+72px)]">
      <div className="mb-2.5 text-xs font-semibold tracking-[-0.01em] text-slate-900">
        Мебель и техника
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {FURNITURE_PRESETS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={cn(
              "flex cursor-pointer flex-col items-center gap-1 rounded-[10px] border border-transparent bg-slate-50 p-2 px-1 transition-[border-color,background] duration-[120ms] ease-in-out",
              "hover:border-slate-300 hover:bg-slate-100",
              selected === item.key &&
                "!border-slate-900 !bg-slate-900 [&_span]:text-white",
            )}
            title={item.label}
            onClick={() => onSelect(item.key)}
          >
            <img
              className="h-9 w-9 object-contain"
              src={MAP_ICONS[item.key]}
              alt={item.label}
            />
            <span className="text-center text-[10px] leading-[1.2] text-slate-500">
              {item.label}
            </span>
          </button>
        ))}
      </div>
      <p className="m-0 mt-2.5 text-[11px] leading-[1.35] text-slate-400">
        Выберите предмет и кликните на карту
      </p>
    </div>
  );
}

export default FurniturePalette;