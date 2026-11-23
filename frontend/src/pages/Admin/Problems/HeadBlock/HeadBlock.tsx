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
    <div className="mb-2 mt-[18px] flex w-full flex-row items-center justify-between gap-3">
      <div className="flex w-80 shrink-0 items-center rounded-[10px] border border-line bg-white px-3.5 py-2.5 transition-[border-color,box-shadow] focus-within:border-line-strong focus-within:shadow-[0_0_0_3px_rgba(17,17,17,0.05)]">
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
          className="px-[18px]"
          onClick={() => handleExportExcel(tableData, tableHeader)}
        >
          Экспорт
        </Button>
        <Button className="px-5" onClick={() => setModalShow(true)}>
          + Создать заявку на ремонт
        </Button>
      </div>
    </div>
  );
}

export default HeadBlock;