import { AnimatePresence, motion } from "framer-motion";
import styles from "./ModalAddObject.module.scss";
import arrow from "@assets/images/icons/arrowMini.svg";
import { addEquipmentData } from "./data";
import { useState } from "react";
import ModalAllIcons from "../../../../modules/ModalAllIcons/ModalAllIcons";
import { useDispatch } from "react-redux";
import { addObject } from "../../../../store/convaSlice/conva.Slice";

function ModalAddObject({ title, show, setShow }) {
  const dispatch = useDispatch();
  const [modalAllIcons, setModalAllIcons] = useState(false);
  const inputs = addEquipmentData;

  const [data, setData] = useState({
    name: "",
    type: "",
    equipment: "",
    floor: "",
    icon: "",
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    width: 100,
    height: 100,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    zIndex: 800,
    isLocked: false,
  });

  const funSetData = (key, value) => {
    setData({ ...data, [key]: value });
  };

  const funSave = () => {
    setShow(false);
    dispatch(addObject({ data }));
  };

  const funClick = (key) => {
    if (key === "icon") setModalAllIcons(true);
  };

  //! при клике на иконку
  const funCliclImg = (icon) => {
    funSetData("icon", icon);
    setModalAllIcons(false);
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
          <ModalAllIcons
            show={modalAllIcons}
            setShow={setModalAllIcons}
            funCliclImg={funCliclImg}
          />

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
                  <div
                    className={styles.input_box_icon}
                    name={item.key}
                    key={index}
                  >
                    <span className={styles.name}>{item.name}</span>
                    <div className={styles.input}>
                      {item.key === "floor" && (
                        <input
                          key={index}
                          type={item.type}
                          autoComplete="new-password"
                          placeholder={"Не указанно"}
                          value={data[item.key]}
                          onChange={(e) => funSetData(item.key, e.target.value)}
                        />
                      )}

                      {item.key === "icon" && data[item.key] && (
                        <img
                          className={styles.icon}
                          src={data[item.key]}
                          alt="icon"
                        />
                      )}

                      <img
                        className={styles.arrow}
                        src={arrow}
                        alt="arrow"
                        onClick={() => funClick(item.key)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className={styles.input_box} name={item.key} key={index}>
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
                      <img className={styles.arrow} src={arrow} alt="arrow" />
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
