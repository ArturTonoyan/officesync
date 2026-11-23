import arrow from "@assets/images/icons/arrow.svg";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@store/hooks";
import {
  setDataParam,
  setSelected,
} from "../../../../store/convaSlice/conva.Slice";
import lupa from "@assets/images/icons/lupa.svg";
import zamokFalse from "@assets/images/icons/zamokFalse.svg";
import zamokTrue from "@assets/images/icons/zamokTrue.svg";
import { funAllSearch } from "../../../../utils/functions/funcions";
import { useEffect, useState } from "react";
import { cn } from "@utils/cn";
import { Input } from "@components/ui";

function LeftMenu() {
  const dispatch = useDispatch();
  const [openMenu, setOpenMenu] = useState(true);
  const itemSelected = useAppSelector(
    (state) => state.conva.objects.selectedObject
  );
  const objects = useAppSelector((state) => state.conva.objects.data);
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");

  const funClickObject = (id) => {
    dispatch(setSelected(id));
  };

  useEffect(() => {
    setData(funAllSearch(search, objects));
  }, [search, objects]);

  const funLocked = (id) => {
    dispatch(
      setDataParam({
        key: "isLocked",
        value: !objects.find((item) => item.id === id).isLocked,
        id,
      })
    );
  };

  return (
    <div
      className={cn(
        "fixed top-[95px] left-0 z-[90] box-border h-[calc(100vh-95px)] w-[var(--spacing-sidebar)] border-r border-line bg-[#fafafa] transition-[left] duration-150 ease-in-out",
        !openMenu && "!left-[calc(-1*var(--spacing-sidebar)+20px)]",
      )}
    >
      <div className="mx-3 mt-2 mb-3 flex w-[calc(100%-24px)] flex-row items-center rounded-sm border border-line bg-bg pr-2 transition-[border-color] duration-[120ms] ease-in-out focus-within:border-[#c8c8cc] focus-within:bg-white">
        <Input
          bare
          type="text"
          className="px-3 py-2.5 text-[13px]"
          placeholder="Поиск"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <img src={lupa} alt="🔍" />
      </div>
      <div className="flex flex-row items-center justify-between px-3.5 pt-3.5 pb-2">
        <h3 className="m-0 p-0 text-[13px] font-semibold tracking-[-0.01em] text-fg">
          Объекты
        </h3>
        <img
          src={arrow}
          alt="arrow"
          onClick={() => setOpenMenu(!openMenu)}
          className={cn(
            "h-[18px] w-[18px] cursor-pointer opacity-[0.55] transition-opacity duration-[120ms] hover:opacity-90",
            !openMenu && "scale-x-[-1]",
          )}
        />
      </div>
      <div className="flex h-[calc(100%-120px)] flex-col overflow-y-auto px-2 pb-4">
        {data.map((item, index) => (
          <div
            key={index}
            className={cn(
              "mb-0.5 flex cursor-pointer flex-row items-center justify-between rounded-sm px-2.5 py-2 transition-colors duration-[120ms] ease-in-out hover:bg-[#f5f5f6]",
              item.id === itemSelected?.id && "bg-[#efefef]",
            )}
            onClick={() => funClickObject(item.id)}
          >
            <span
              className={cn(
                "text-[13px] font-medium tracking-[-0.01em] text-[#3a3a3e]",
                item.id === itemSelected?.id && "font-semibold text-fg",
              )}
            >
              {item.name}
            </span>
            <img
              onClick={() => funLocked(item.id)}
              src={!item.isLocked ? zamokTrue : zamokFalse}
              alt="zamokFalse"
              className={cn(
                "h-4 w-4 opacity-[0.55]",
                item.id === itemSelected?.id && "opacity-90",
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LeftMenu;