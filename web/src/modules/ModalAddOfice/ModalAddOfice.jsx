import { AnimatePresence, motion } from "framer-motion";
import styles from "./ModalAddOfice.module.scss";
import { useState } from "react";
import { formatPhoneNumber } from "../../utils/validations/Validations";

function ModalAddOfice({
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
  const funChange = (key, value) => {
    let newVal = value;
    if (key === "phone") {
      newVal = formatPhoneNumber(value);
    }
    setData({ ...data, [key]: newVal });
  };

  const funChangeList = (keysDatas) => {
    console.log("keysDatas", keysDatas);
    setData({ ...data, ...keysDatas });
    setOpenList(null);
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
                    <input
                      key={index}
                      type={item.type}
                      autoComplete="new-password"
                      placeholder={item.placeholder || "Не указанно"}
                      value={data?.[item.key]}
                      onChange={(e) => funChange(item.key, e.target.value)}
                      readOnly={lists?.[item.key]}
                      onClick={() =>
                        lists?.[item.key] ? setOpenList(item.key) : null
                      }
                      style={lists?.[item.key] ? { cursor: "pointer" } : {}}
                    />
                    {openList === item.key && lists[item.key] && (
                      <div className={styles.list}>
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
