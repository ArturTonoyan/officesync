import logo from "@assets/images/logo/logo.svg";
import brainIcon from "@assets/images/icons/brain.svg";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@store/hooks";
import { Button } from "@components/ui";
import { cn } from "@utils/cn";
import type { ReactNode } from "react";

type Props = {
  funSave: () => void;
  funDownload: () => void;
  noedit?: boolean;
  modeToggle?: ReactNode;
  onAutoPlan?: () => void;
  onEvacuationMap?: () => void;
  onSafetyGear?: () => void;
  safetyModeActive?: boolean;
  onNorms?: () => void;
  normsCount?: number;
  /** оставлены для совместимости с вызовами */
  offices?: unknown;
  floors?: unknown;
};

function TopMenu({
  funSave,
  funDownload,
  noedit,
  modeToggle,
  onAutoPlan,
  onEvacuationMap,
  onSafetyGear,
  safetyModeActive = false,
  onNorms,
  normsCount = 0,
}: Props) {
  const selectOffice = useAppSelector(
    (state) => state.conva.offices.selectedObject,
  ) as { name?: string } | null;
  const selectFloor = useAppSelector(
    (state) => state.conva.floors.selectedObject,
  ) as { name?: string; number?: number } | null;

  const navigate = useNavigate();

  const officeName = selectOffice?.name || "Офис";
  const floorName =
    selectFloor?.name ||
    (selectFloor?.number != null ? `${selectFloor.number} этаж` : "Этаж");

  return (
    <header
      className={cn(
        "fixed top-0 z-[100] flex h-16 items-center gap-4 border-b border-line bg-elevated px-4",
        noedit ? "right-0 left-auto w-max border-0 bg-transparent" : "inset-x-0",
      )}
    >
      {!noedit && (
        <>
          <button
            type="button"
            className="flex shrink-0 items-center transition-opacity hover:opacity-70"
            onClick={() => navigate("/")}
            aria-label="На главную"
          >
            <img src={logo} alt="OfficeSync" className="h-10 w-auto max-w-[220px] object-contain object-left" />
          </button>

          <Button
            variant="secondary"
            className="h-9 shrink-0"
            onClick={() => navigate("/admin/catalog")}
          >
            ← Каталог
          </Button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-fg">
              {officeName}
              <span className="mx-2 font-medium text-fg-muted">·</span>
              {floorName}
            </p>
            <p className="truncate text-[11px] font-medium text-fg-muted">
              Редактирование карты · сменить этаж можно в каталоге
            </p>
          </div>
        </>
      )}

      {noedit && (
        <div className="min-w-0 px-2">
          <p className="truncate text-[13px] font-semibold text-fg">
            {officeName}
            <span className="mx-2 text-fg-muted">·</span>
            {floorName}
          </p>
        </div>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {modeToggle}
        {!noedit && (
          <>
            <Button variant="secondary" className="h-9" onClick={onNorms}>
              Нормы
              {normsCount > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-[#b32020] px-1 text-[10px] font-bold text-white">
                  {normsCount}
                </span>
              )}
            </Button>
            <Button
              className="h-9 gap-2 border-[#482BE7] bg-[#482BE7] text-white hover:bg-[#3a22c4] hover:border-[#3a22c4]"
              onClick={onAutoPlan}
            >
              <img
                src={brainIcon}
                alt=""
                aria-hidden
                className="h-4 w-4 brightness-0 invert"
              />
              Автоплан
            </Button>
            <Button
              variant="secondary"
              className="h-9 gap-2"
              onClick={onEvacuationMap}
              title="Цветной план эвакуации по ГОСТ"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                className="shrink-0"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M7 16l4-5 3 3 3-4"
                  stroke="#00A651"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="16" cy="10" r="1.5" fill="#E30613" />
              </svg>
              План эвакуации
            </Button>
            <Button
              variant="secondary"
              className={cn(
                "h-9 gap-2",
                safetyModeActive &&
                  "border-ink bg-ink text-white hover:bg-ink/90 hover:border-ink",
              )}
              onClick={onSafetyGear}
              title="Режим безопасности: огнетушители, знаки, аптечки"
              aria-pressed={safetyModeActive}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                className="shrink-0"
              >
                <rect
                  x="4"
                  y="3"
                  width="10"
                  height="16"
                  rx="2"
                  fill="#E30613"
                />
                <path
                  d="M14 7h4v3h-2l2 4h-3"
                  stroke="#E30613"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="15"
                  y="15"
                  width="6"
                  height="5"
                  rx="0.5"
                  fill="#00A651"
                />
              </svg>
              Безопасность
            </Button>
            <Button
              variant="secondary"
              className="h-9 gap-2"
              onClick={funDownload}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                className="shrink-0"
              >
                <path
                  d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Экспорт
            </Button>
            <Button className="h-9 gap-2" onClick={funSave}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                className="shrink-0"
              >
                <path
                  d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17 21v-8H7v8M7 3v5h8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Сохранить
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

export default TopMenu;
