import { AnimatePresence, motion } from "framer-motion";
import styles from "./ModalAddOfice.module.scss";
import { useEffect, useRef, useState } from "react";
import { formatPhoneNumber } from "../../utils/validations/Validations";
import TextField from "@mui/material/Input";

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
    const handleClickOutside = (event) => {
      if (listRef.current && !listRef.current.contains(event.target)) {
        setOpenList(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    console.log("keysDatas", keysDatas);
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
          className={styles.ModalAddOfice}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={styles.container}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            {title && <h2>{title}</h2>}
            <div className={styles.form}>
              {inputs?.map((item, index) => (
                <div className={styles.input_box} name={item.key} key={index}>
                  <span className={styles.name}>{item.name}</span>
                  <div className={styles.input}>
                    {item?.type === "descr" && (
                      <textarea
                        value={data?.[item.key] ?? ""}
                        onChange={(e) =>
                          funChange(item.type, item.key, e.target.value)
                        }
                      />
                    )}
                    {item?.type !== "descr" && (
                      <input
                        key={index}
                        type={item.type}
                        autoComplete="new-password"
                        placeholder={item.placeholder || "Не указанно"}
                        accept={item.accept || ""}
                        value={
                          item.type === "file" ? "" : data?.[item.key] ?? ""
                        }
                        onChange={(e) =>
                          funChange(item.type, item.key, e.target.value)
                        }
                        readOnly={lists?.[item.key]}
                        onClick={() =>
                          lists?.[item.key] ? setOpenList(item.key) : null
                        }
                        style={lists?.[item.key] ? { cursor: "pointer" } : {}}
                        id={item.key}
                      />
                    )}
                    {item.type === "file" && (
                      <div
                        className={styles.file}
                        onClick={() => {
                          document.getElementById(item.key).click();
                        }}
                      >
                        <span>
                          {data?.[item.key]?.name || "Файл не выбран"}
                        </span>
                      </div>
                    )}
                    {openList === item.key && lists[item.key] && (
                      <div className={styles.list} ref={listRef}>
                        {lists[item.key]?.data?.map((elem, ind) => (
                          <div
                            className={styles.item}
                            key={ind}
                            onClick={() =>
                              funChangeList({
                                [lists[item.key]?.key]: elem.id,
                                [item.key]: [
                                  lists[item.key]?.value
                                    ?.map((item) => elem[item])
                                    .join(" "),
                                ],
                                [lists[item.key]?.obj?.key]:
                                  elem[lists[item.key]?.obj?.value],
                              })
                            }
                          >
                            {lists[item.key]?.value?.map((item, index) => (
                              <span key={index}>{elem[item]} </span>
                            ))}
                            {lists?.value?.length === 0 && <span>{elem}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.btn}>
              <button className={styles.cancel} onClick={() => setShow(false)}>
                Отменить
              </button>
              <button className={styles.save} onClick={funSave}>
                Сохранить
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ModalAddOfice;
