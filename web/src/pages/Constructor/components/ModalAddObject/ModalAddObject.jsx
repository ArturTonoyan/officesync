import { AnimatePresence, motion } from "framer-motion";
import styles from "./ModalAddObject.module.scss";
import arrow from "@assets/images/icons/arrowMini.svg";
import { addEquipmentData } from "./data";
import { useEffect, useState } from "react";
import ModalAllIcons from "../../../../modules/ModalAllIcons/ModalAllIcons";
import { useDispatch, useSelector } from "react-redux";
import { addObjectApi } from "../../../../store/convaSlice/conva.Slice";
import {
  apiEddElement,
  apiGetEquipments,
  apiGetUsers,
} from "../../../../api/apirequests";
import { useQuery } from "@tanstack/react-query";

const typesNoEquipment = [
  "Кабинет",
  "Переговорная",
  "Рабочее место",
  "Сотрудник",
];
const types = [
  "Кабинет",
  "Переговорная",
  "Рабочее место",
  "Мебель",
  "Техника",
  "Сотрудник",
  "Другое",
];

const defaultData = {
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

function ModalAddObject({ title, show, setShow }) {
  const user = useSelector((state) => state.user.user.data);
  const floorId = useSelector((state) => state.conva.floors.selected);
  const dispatch = useDispatch();

  const [modalAllIcons, setModalAllIcons] = useState(false);
  const [showDropdown, setShowDropdown] = useState(null);
  const [data, setData] = useState(defaultData);

  const { data: equipments } = useQuery({
    queryKey: ["equipments/all/id", user?.companyId],
    queryFn: () => apiGetEquipments(user?.companyId),
    staleTime: Infinity,
    enabled: !!user?.companyId,
  });

  const { data: users } = useQuery({
    queryKey: ["users/all", user?.companyId],
    queryFn: () => apiGetUsers(user?.companyId),
    staleTime: Infinity,
    enabled: !!user?.companyId,
  });

  const handleSetData = (key, value) => {
    if (key === "icon") {
      const img = new Image();
      img.src = value;
      img.onload = () => {
        const maxSize = 100;
        let { width, height } = img;
        const ratio = width / height;

        if (width > maxSize || height > maxSize) {
          if (ratio >= 1) {
            width = maxSize;
            height = maxSize / ratio;
          } else {
            height = maxSize;
            width = maxSize * ratio;
          }
        }

        setData((prev) => ({ ...prev, icon: value, width, height }));
      };
    } else if (key === "user") {
      setData((prev) => ({
        ...prev,
        user: `${value.surname} ${value.name} ${value.patronymic}`,
        userId: value.id,
      }));
    } else if (key === "equipment") {
      setData((prev) => ({
        ...prev,
        equipment: `${value.name} ${value.inventoryNumber}`,
        equipmentId: value.id,
      }));
    } else {
      setData((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleSave = () => {
    setShow(false);
    const formData = new FormData();
    Object.entries({
      ...data,
      name: data.name || "Новый объект",
      floorId,
      image: data.icon,
    }).forEach(([key, value]) => formData.append(key, value));

    apiEddElement(formData).then((res) => {
      if (res.status === 201) {
        dispatch(addObjectApi({ data: res.data }));
        setData(defaultData);
      }
    });
  };

  const renderDropdownList = (key) => {
    let list = [];
    if (key === "type") list = types;
    if (key === "equipment") list = equipments?.data || [];
    if (key === "user") list = users?.data || [];

    return (
      <ul>
        {list.map((item, index) => {
          const label =
            key === "type"
              ? item
              : key === "equipment"
              ? `${item.name} ${item.inventoryNumber}`
              : `${item.surname} ${item.name} ${item.patronymic} ${item.email}`;
          return (
            <li
              key={index}
              onClick={() => {
                handleSetData(key, item);
                setShowDropdown(null);
              }}
            >
              {label}
            </li>
          );
        })}
      </ul>
    );
  };

  const renderInput = (item) => {
    if (item.key === "icon") {
      return (
        <div className={styles.input_box_icon} key={item.key}>
          <span className={styles.name}>{item.name}</span>
          <div className={styles.input}>
            {data.icon && (
              <img className={styles.icon} src={data.icon} alt="icon" />
            )}
            <img
              className={styles.arrow}
              src={arrow}
              alt="arrow"
              onClick={() => setModalAllIcons(true)}
            />
          </div>
        </div>
      );
    }

    if (typesNoEquipment.includes(data.type) && item.key === "equipment")
      return null;

    return (
      <div className={styles.input_box} key={item.key}>
        <span className={styles.name}>{item.name}</span>
        <div className={styles.input}>
          <input
            type={item.type}
            autoComplete="new-password"
            placeholder="Не указано"
            value={data[item.key] || ""}
            onClick={
              item.type === "list" ? () => setShowDropdown(item.key) : null
            }
            onChange={(e) => handleSetData(item.key, e.target.value)}
            readOnly={item.type === "list"}
            style={{ cursor: item.type === "list" ? "pointer" : "" }}
          />
          {item.type === "list" && (
            <>
              <img className={styles.arrow} src={arrow} alt="arrow" />
              {showDropdown === item.key && (
                <div className={styles.list}>
                  {renderDropdownList(item.key)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
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
            funCliclImg={(icon) => {
              handleSetData("icon", icon);
              setModalAllIcons(false);
            }}
          />

          <motion.div
            className={styles.container}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            {title && <h2>{title}</h2>}
            <div className={styles.form}>
              {addEquipmentData.map(renderInput)}
            </div>
            <div className={styles.btn}>
              <button
                className={styles.cancel}
                onClick={() => {
                  setShow(false);
                  setData(defaultData);
                }}
              >
                Отменить
              </button>
              <button className={styles.save} onClick={handleSave}>
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
