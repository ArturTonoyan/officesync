import lupa from "@assets/images/icons/lupa.svg";
import { handleExportExcel } from "../../../../utils/functions/funcions";
import { Button, Input } from "@components/ui";

function HeadBlock({
  tableData,
  tableHeader,
  shearchParam,
  setShearchParam,
  setModalShow,
}) {
  return (
    <div className="mb-3 mt-[18px] flex w-full flex-row flex-wrap items-center justify-between gap-3">
      <div className="flex h-11 w-80 max-w-full shrink-0 items-center rounded-xl border border-[#ebebef] bg-white px-3.5 shadow-[0_1px_3px_rgba(17,17,17,0.03)] transition-[border-color] focus-within:border-[#d8d8dc]">
        <img
          src={lupa}
          alt=""
          className="mr-2.5 h-4 w-4 shrink-0 opacity-40"
        />
        <Input
          bare
          value={shearchParam}
          onChange={(e) => setShearchParam(e.target.value)}
          type="text"
          placeholder="Поиск…"
          className="text-sm font-normal"
        />
      </div>
      <div className="ml-auto flex shrink-0 flex-row items-center gap-2.5">
        <Button
          variant="secondary"
          className="h-11 rounded-xl px-[18px]"
          onClick={() => handleExportExcel(tableData, tableHeader)}
        >
          Экспорт
        </Button>
        <Button className="h-11 rounded-xl px-5" onClick={() => setModalShow(true)}>
          + Добавить этаж
        </Button>
      </div>
    </div>
  );
}

export default HeadBlock;