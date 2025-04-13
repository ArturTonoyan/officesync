import { AnimatePresence, motion } from "framer-motion";
import styles from "./ModalAddObject.module.scss";
import arrow from "@assets/images/icons/arrowMini.svg";
import { addEquipmentData } from "./data";
import { useEffect, useState } from "react";
import ModalAllIcons from "../../../../modules/ModalAllIcons/ModalAllIcons";
import { useDispatch, useSelector } from "react-redux";
import {
  addObject,
  addObjectApi,
} from "../../../../store/convaSlice/conva.Slice";
import { apiEddElement } from "../../../../api/apirequests";

function ModalAddObject({ title, show, setShow }) {
  const dispatch = useDispatch();
  const [modalAllIcons, setModalAllIcons] = useState(false);
  const inputs = addEquipmentData;
  const floorId = useSelector((state) => state.conva.floors.selected);

  const obj = {
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
  };

  const [data, setData] = useState(obj);

  const funSetData = (key, value) => {
    if (key === "icon") {
      const img = new Image();
      img.src = value;

      //! получаем реальные размеры фото
      img.onload = () => {
        let { width, height } = img;

        const maxSize = 100;
        const aspectRatio = width / height;

        if (width > maxSize || height > maxSize) {
          if (aspectRatio >= 1) {
            width = maxSize;
            height = maxSize / aspectRatio;
          } else {
            height = maxSize;
            width = maxSize * aspectRatio;
          }
        }

        setData((prevData) => ({
          ...prevData,
          icon: value,
          width,
          height,
        }));
      };
    } else {
      setData((prevData) => ({ ...prevData, [key]: value }));
    }
  };

  const funSave = () => {
    setShow(false);
    const formatData = new FormData();
    formatData.append("name", data.name || "Новый объект");
    formatData.append("type", data.type);
    formatData.append("equipment", data.equipment);
    formatData.append("floorId", floorId);
    formatData.append("image", data.icon);
    formatData.append("x", data.x);
    formatData.append("y", data.y);
    formatData.append("width", data.width);
    formatData.append("height", data.height);
    formatData.append("rotation", data.rotation);
    formatData.append("scaleX", data.scaleX);
    formatData.append("scaleY", data.scaleY);
    formatData.append("zIndex", data.zIndex);
    formatData.append("isLocked", data.isLocked);

    apiEddElement(formatData).then((res) => {
      console.log("res", res);
      if (res.status === 201) {
        setShow(false);
        dispatch(addObjectApi({ data: res.data }));
      }
      setData(obj);
    });
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
                item.key === "icon" ? (
                  <div
                    className={styles.input_box_icon}
                    name={item.key}
                    key={index}
                  >
                    <span className={styles.name}>{item.name}</span>
                    <div className={styles.input}>
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
                        readOnly={item.type === "list"}
                        style={{
                          cursor: item.type === "list" ? "pointer" : "",
                        }}
                      />
                      {item.type === "list" && (
                        <img className={styles.arrow} src={arrow} alt="arrow" />
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
            <div className={styles.btn}>
              <button
                className={styles.cancel}
                onClick={() => {
                  setShow(false);
                  setData(obj);
                }}
              >
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
