import { AnimatePresence, motion } from "framer-motion";
import styles from "./ModalAddObject.module.scss";
import arrow from "@assets/images/icons/arrowMini.svg";
import { addEquipmentData, typesNoEquipment } from "./data";
import { useEffect, useRef, useState } from "react";
import ModalAllIcons from "../../../../modules/ModalAllIcons/ModalAllIcons";
import { useDispatch, useSelector } from "react-redux";
import {
  addObjectApi,
  setSelected,
} from "../../../../store/convaSlice/conva.Slice";
import {
  apiEddElement,
  apiGetEquipments,
  apiGetUsers,
  apiUpdateElement,
} from "../../../../api/apirequests";
import { useQuery } from "@tanstack/react-query";

const types = [
  {
    value: "Этаж",
    zIndex: 100,
  },
  {
    value: "Кабинет",
    zIndex: 300,
  },
  {
    value: "Переговорная",
    zIndex: 300,
  },
  {
    value: "Рабочее место",
    zIndex: 300,
  },
  {
    value: "Мебель",
    zIndex: 400,
  },
  {
    value: "Оборудование",
    zIndex: 500,
  },
  {
    value: "Сотрудник",
    zIndex: 600,
  },
  {
    value: "Дверь",
    zIndex: 900,
  },
  {
    value: "Другое",
    zIndex: 450,
  },
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

function ModalAddObject({
  funGetElem,
  editData,
  setEditData,
  title,
  show,
  setShow,
}) {
  const selectetObject = useSelector(
    (state) => state.conva.objects.selectedObject
  );
  const user = useSelector((state) => state.user.user.data);
  const floorId = useSelector((state) => state.conva.floors.selected);
  const dispatch = useDispatch();
  const refList = useRef(null);
  const [copiedData, setCopiedData] = useState(null);

  const [modalAllIcons, setModalAllIcons] = useState(false);
  const [showDropdown, setShowDropdown] = useState(null);
  const [data, setData] = useState(defaultData);
  console.log("copiedData", copiedData);

  const { data: usersQuery } = useQuery({
    queryKey: ["users/all/id", user?.companyId],
    queryFn: () => apiGetUsers(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey && e.key === "с") ||
        (e.ctrlKey && e.key === "c") ||
        (e.metaKey && e.key === "С") ||
        (e.metaKey && e.key === "C")
      ) {
        if (selectetObject) {
          setCopiedData(selectetObject);
        }
      }

      if (
        (e.ctrlKey && e.key === "v") ||
        (e.ctrlKey && e.key === "м") ||
        (e.metaKey && e.key === "V") ||
        (e.metaKey && e.key === "М")
      ) {
        console.log("вставить");
        if (copiedData) {
          // создаем новый объект с новыми координатами
          const newObject = {
            ...copiedData,
            x: copiedData.x + 20,
            y: copiedData.y + 20,
            name: copiedData.name,
          };
          delete newObject.id;

          //! убираем все что имеет null
          for (const key in newObject) {
            if (newObject[key] === null) {
              delete newObject[key];
            }
          }

          // формируем formData и отправляем в API
          const formData = new FormData();
          Object.entries({
            ...newObject,
            name: newObject.name || "Новый объект",
            floorId,
          }).forEach(([key, value]) => formData.append(key, value));

          apiEddElement(formData).then((res) => {
            if (res.status === 201) {
              dispatch(addObjectApi({ data: res.data }));
              dispatch(setSelected(res?.data?.id));
            } else {
              console.warn("Ошибка при сохранении копии");
            }
          });
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [copiedData, selectetObject, floorId, dispatch]);

  useEffect(() => {
    if (editData) {
      setData({
        ...editData,
        equipment: editData.equipment?.name,
        user: usersQuery?.data?.find((u) => u.id === editData.userId)
          ? (usersQuery?.data?.find((u) => u.id === editData.userId)?.surname ||
              "") +
            " " +
            (usersQuery?.data?.find((u) => u.id === editData.userId)?.name ||
              "") +
            " " +
            (usersQuery?.data?.find((u) => u.id === editData.userId)
              ?.patronymic || "") +
            " " +
            (usersQuery?.data?.find((u) => u.id === editData.userId)?.email ||
              "")
          : "",
        icon: editData.image,
      });
    } else {
      setData(defaultData);
    }
  }, [editData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (refList.current && !refList.current.contains(event.target)) {
        setShowDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    } else if (key === "type") {
      setData((prev) => ({
        ...prev,
        [key]: value?.value,
        zIndex: value?.zIndex,
      }));
    } else {
      setData((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleSave = () => {
    setShow(false);
    const dat = { ...data };
    const formData = new FormData();
    //! убираем все что имеет null
    for (const key in dat) {
      if (dat[key] === null) {
        delete dat[key];
      }
      if (dat[key] === undefined) {
        delete dat[key];
      }
    }
    Object.entries({
      ...dat,
      name: dat.name || "Новый объект",
      floorId,
      image: dat.icon,
    }).forEach(([key, value]) => formData.append(key, value));
    if (editData) {
      apiUpdateElement(editData.id, formData).then((res) => {
        if (res.status === 200) {
          dispatch(addObjectApi({ data: res.data }));
          funGetElem();
        }
      });
    } else {
      apiEddElement(formData).then((res) => {
        if (res.status === 201) {
          dispatch(addObjectApi({ data: res.data }));
          setData(defaultData);
        }
      });
    }
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
              ? item.value
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
                <div className={styles.list} ref={refList}>
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
                  setEditData(null);
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
