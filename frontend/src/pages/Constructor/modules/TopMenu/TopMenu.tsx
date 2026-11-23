import logo from "@assets/images/logo/logo.svg";
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
  /** оставлены для совместимости с вызовами */
  offices?: unknown;
  floors?: unknown;
};

function TopMenu({ funSave, funDownload, noedit, modeToggle }: Props) {
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
            onClick={() => navigate("/catalog")}
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
            <Button variant="secondary" className="h-9" onClick={funDownload}>
              Экспорт
            </Button>
            <Button className="h-9" onClick={funSave}>
              Сохранить
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

export default TopMenu;
