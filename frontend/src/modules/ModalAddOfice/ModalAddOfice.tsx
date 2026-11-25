import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { formatPhoneNumber } from "../../utils/validations/Validations";
import { Button } from "@components/ui";

function ModalAddOfice({
  edit,
  setEdit,
  title,
  inputs,
  show,
  setShow,
  data,
  setData,
  funSave,
  lists,
}) {
  const [openList, setOpenList] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!show) {
      setOpenList(null);
      return;
    }

    const handleClickOutside = (event) => {
      if (listRef.current && !listRef.current.contains(event.target)) {
        setOpenList(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setShow(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [show, setShow]);

  const funChange = (type, key, value) => {
    if (type === "file") {
      setData({ ...data, [key]: document?.getElementById(key)?.files[0] });
      if (edit) {
        setEdit({ ...edit, [key]: document?.getElementById(key)?.files[0] });
      }
      return;
    }
    let newVal = value;
    if (key === "phone" || key === "renterContact") {
      newVal = formatPhoneNumber(value);
    }
    setData({ ...data, [key]: newVal });
    if (edit) {
      setEdit({ ...edit, [key]: newVal });
    }
  };

  const funChangeList = (keysDatas) => {
    setData({ ...data, ...keysDatas });
    setOpenList(null);
    if (edit) {
      setEdit({ ...edit, ...keysDatas });
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[10000] box-border flex h-full w-full items-start justify-center overflow-y-auto bg-[rgba(17,17,17,0.35)] p-5 pt-10 backdrop-blur-[8px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShow(false);
          }}
        >
          <motion.div
            className="mx-auto box-border flex max-h-[calc(100vh-80px)] w-full min-w-0 max-w-[760px] flex-col overflow-hidden rounded-xl border border-line bg-elevated p-7 pb-6 shadow-card"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {title && (
              <h2 className="mb-[22px] shrink-0 text-[22px] font-bold tracking-[-0.03em] text-fg">
                {title}
              </h2>
            )}
            <div className="scrollbar-thin grid min-h-0 flex-1 grid-cols-2 gap-x-[18px] gap-y-4 overflow-y-auto pr-1 max-[640px]:grid-cols-1">
              {inputs?.map((item, index) => (
                <div className="w-full min-w-0" key={item.key || index}>
                  <span className="block pb-2 text-[13px] font-semibold tracking-[-0.01em] text-fg-secondary">
                    {item.name}
                  </span>
                  <div className="relative box-border flex w-full items-center rounded-md border border-line bg-bg shadow-soft transition-[border-color,box-shadow] focus-within:border-fg focus-within:shadow-[0_0_0_3px_rgba(17,17,17,0.06)]">
                    {item?.type === "descr" && (
                      <textarea
                        value={data?.[item.key] ?? ""}
                        onChange={(e) =>
                          funChange(item.type, item.key, e.target.value)
                        }
                        placeholder={item.placeholder || "Не указано"}
                        className="scrollbar-thin max-h-[180px] min-h-[88px] w-full resize-y rounded-md border-0 bg-transparent px-3.5 py-3 text-sm font-normal text-fg outline-none"
                      />
                    )}
                    {item?.type !== "descr" && (
                      <input
                        type={item.type === "file" ? "file" : item.type}
                        autoComplete="new-password"
                        placeholder={item.placeholder || "Не указано"}
                        accept={item.accept || ""}
                        value={
                          item.type === "file" ? undefined : data?.[item.key] ?? ""
                        }
                        onChange={(e) =>
                          funChange(item.type, item.key, e.target.value)
                        }
                        readOnly={!!lists?.[item.key]}
                        onClick={() =>
                          lists?.[item.key] ? setOpenList(item.key) : null
                        }
                        style={lists?.[item.key] ? { cursor: "pointer" } : {}}
                        id={item.key}
                        className={
                          lists?.[item.key]
                            ? "box-border min-w-0 flex-1 rounded-md border-0 bg-transparent py-3 pl-3.5 pr-2 text-sm font-normal text-fg outline-none"
                            : "box-border w-full rounded-md border-0 bg-transparent px-3.5 py-3 text-sm font-normal text-fg outline-none"
                        }
                      />
                    )}
                    {lists?.[item.key] && item?.type !== "descr" && (
                      <button
                        type="button"
                        aria-label="Открыть список"
                        className="mr-3.5 flex h-3 w-3 shrink-0 items-center justify-center border-0 bg-transparent p-0"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() =>
                          setOpenList((prev) =>
                            prev === item.key ? null : item.key,
                          )
                        }
                      >
                        <span
                          aria-hidden
                          className={`block h-0 w-0 border-x-[4px] border-t-[5px] border-x-transparent border-t-fg-muted transition-transform ${
                            openList === item.key ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    )}
                    {item.type === "file" && (
                      <div
                        className="scrollbar-thin min-h-5 w-full cursor-pointer overflow-y-auto px-3.5 py-3 text-[13px] text-fg-secondary"
                        onClick={() => {
                          document.getElementById(item.key)?.click();
                        }}
                      >
                        <span>
                          {data?.[item.key]?.name || "Файл не выбран"}
                        </span>
                      </div>
                    )}
                    {openList === item.key && lists?.[item.key] && (
                      <div
                        className="scrollbar-thin absolute left-0 top-[calc(100%+4px)] z-[100] flex max-h-[200px] w-full flex-col overflow-x-hidden overflow-y-auto rounded-md border border-line bg-elevated shadow-card"
                        ref={listRef}
                      >
                        {lists[item.key]?.data?.map((elem, ind) => (
                          <div
                            className="cursor-pointer px-3.5 py-2.5 text-[13px] text-fg transition-colors hover:bg-hover active:bg-muted"
                            key={elem.id || ind}
                            onClick={() =>
                              funChangeList({
                                [lists[item.key]?.key]: elem.id,
                                [item.key]: lists[item.key]?.value
                                  ?.map((field) => elem[field])
                                  .join(" "),
                                [lists[item.key]?.obj?.key]:
                                  elem[lists[item.key]?.obj?.value],
                              })
                            }
                          >
                            {lists[item.key]?.value?.map((field, fieldIndex) => (
                              <span key={fieldIndex}>{elem[field]} </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-[22px] flex w-full shrink-0 flex-row justify-end gap-3 border-t border-line pt-[18px]">
              <Button
                variant="secondary"
                className="min-w-[110px] px-4"
                onClick={() => setShow(false)}
              >
                Отменить
              </Button>
              <Button className="min-w-[120px] px-[18px]" onClick={funSave}>
                Сохранить
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ModalAddOfice;