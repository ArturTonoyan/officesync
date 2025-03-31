import { AnimatePresence, motion } from "framer-motion";
import styles from "./ModalAddObject.module.scss";
import arrow from "@assets/images/icons/arrowMini.svg";
import { addEquipmentData } from "./data";
import { useState } from "react";

function ModalAddObject({ title, show, setShow, objects, setObjects }) {
  const inputs = addEquipmentData;

  const [data, setData] = useState({
    type: "",
    equipment: "",
    user: "",
    floor: "",
    icon: "",
  });

  const funSetData = (key, value) => {
    setData({ ...data, [key]: value });
  };

  const funSave = () => {
    setShow(false);
    setObjects([...objects, data]);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={styles.ModalAddObject}
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
              {inputs.map((item, index) =>
                item.key === "floor" || item.key === "icon" ? (
                  <div className={styles.input_box_icon} name={item.key}>
                    <span className={styles.name}>{item.name}</span>
                    <div className={styles.input}>
                      <input
                        key={index}
                        type={item.type}
                        autoComplete="new-password"
                        placeholder="Не указанно"
                        value={data[item.key]}
                        onChange={(e) => funSetData(item.key, e.target.value)}
                      />
                      <img src={arrow} alt="arrow" />
                    </div>
                  </div>
                ) : (
                  <div className={styles.input_box} name={item.key}>
                    <span className={styles.name}>{item.name}</span>
                    <div className={styles.input}>
                      <input
                        key={index}
                        type={item.type}
                        autoComplete="new-password"
                        placeholder="Не указанно"
                        value={data[item.key]}
                        onChange={(e) => funSetData(item.key, e.target.value)}
                      />
                      <img src={arrow} alt="arrow" />
                    </div>
                  </div>
                )
              )}
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

export default ModalAddObject;
