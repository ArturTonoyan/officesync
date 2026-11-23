import { useEffect, useRef } from "react";

function ParamContextMenu({ openList, setOpenList, paramMenu, funClick, row }) {
  const listParamRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        listParamRef.current &&
        !listParamRef.current.contains(event.target)
      ) {
        setOpenList(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      {openList && (
        <div
          className="absolute right-[calc(100%+6px)] top-1/2 z-20 flex min-w-[180px] -translate-y-1/2 flex-col justify-start rounded-md border border-line bg-elevated p-2 shadow-card"
          ref={listParamRef}
        >
          {paramMenu.map((item, index) => (
            <button
              key={index}
              className="mb-0.5 flex w-full cursor-pointer flex-row items-center rounded-sm border-0 bg-transparent px-3 py-2.5 text-left text-[13px] font-medium text-fg transition-colors last:mb-0 hover:bg-hover"
              onClick={() => funClick({ ...item, row })}
            >
              <img src={item.icon} alt="" className="mr-2.5 h-[18px] w-[18px] opacity-70" />
              {item.name}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export default ParamContextMenu;