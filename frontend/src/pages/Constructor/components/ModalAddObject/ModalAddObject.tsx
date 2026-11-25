import { AnimatePresence, motion } from "framer-motion";
import arrow from "@assets/images/icons/arrowMini.svg";
import { Button, Input } from "@components/ui";
import { cn } from "@utils/cn";
import { addEquipmentData, typesNoEquipment } from "./data";
import { useEffect, useRef, useState } from "react";
import ModalAllIcons from "../../../../modules/ModalAllIcons/ModalAllIcons";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@store/hooks";
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
  { value: "Этаж", zIndex: 100 },
  { value: "Стена", zIndex: 200 },
  { value: "Кабинет", zIndex: 300 },
  { value: "Переговорная", zIndex: 300 },
  { value: "Рабочее место", zIndex: 550 },
  { value: "Мебель", zIndex: 400 },
  { value: "Оборудование", zIndex: 500 },
  { value: "Сотрудник", zIndex: 600 },
  { value: "Дверь", zIndex: 900 },
  { value: "Другое", zIndex: 450 },
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
  const selectetObject = useAppSelector(
    (state) => state.conva.objects.selectedObject
  );
  const user = useAppSelector((state) => state.user.user.data);
  const floorId = useAppSelector((state) => state.conva.floors.selected);
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
      <ul className="m-0 list-none p-0">
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
              className="box-border w-full cursor-pointer px-3.5 py-2.5 text-[13px] font-medium text-fg transition-colors duration-150 hover:bg-hover"
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
        <div className="w-[48%]" key={item.key}>
          <span className="block pb-2 text-[13px] font-semibold text-fg-secondary">
            {item.name}
          </span>
          <div className="mb-0 flex min-h-[72px] flex-row items-center rounded-sm border border-line bg-elevated shadow-soft transition-[border-color] duration-150 focus-within:border-fg focus-within:shadow-[0_0_0_3px_rgba(17,17,17,0.06)]">
            {data.icon && (
              <img
                className="m-auto h-10 w-10 px-6"
                src={data.icon}
                alt="icon"
              />
            )}
            <img
              className="mr-3.5 ml-auto h-3 w-3 shrink-0 scale-y-[-1] cursor-pointer transition-opacity duration-150 hover:opacity-60 active:opacity-100"
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
      <div className="relative w-full" key={item.key}>
        <span className="block pb-2 text-[13px] font-semibold text-fg-secondary">
          {item.name}
        </span>
        <div className="relative mb-0 flex flex-row items-center rounded-sm border border-line bg-elevated shadow-soft transition-[border-color,box-shadow] duration-150 focus-within:border-fg focus-within:shadow-[0_0_0_3px_rgba(17,17,17,0.06)]">
          <Input
            bare
            type={item.type}
            autoComplete="new-password"
            className={cn(
              "min-w-0 flex-1 px-3.5 py-3 text-sm font-normal text-fg",
              item.type === "list" && "cursor-pointer pr-2",
            )}
            placeholder="Не указано"
            value={data[item.key] || ""}
            onClick={
              item.type === "list" ? () => setShowDropdown(item.key) : undefined
            }
            onChange={(e) => handleSetData(item.key, e.target.value)}
            readOnly={item.type === "list"}
          />
          {item.type === "list" && (
            <>
              <img
                className="mr-3.5 h-3 w-3 shrink-0 scale-y-[-1] cursor-pointer transition-opacity duration-150 hover:opacity-60 active:opacity-100"
                src={arrow}
                alt="arrow"
                onClick={() => setShowDropdown(item.key)}
              />
              {showDropdown === item.key && (
                <div
                  className="absolute top-[calc(100%+4px)] left-0 z-[100] max-h-60 w-full overflow-x-hidden overflow-y-auto rounded-md border border-line bg-elevated shadow-card"
                  ref={refList}
                >
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
          className="fixed inset-0 z-[10000] box-border flex h-full w-full items-start justify-center overflow-y-auto bg-[rgba(17,17,17,0.35)] p-10 px-5 backdrop-blur-md"
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
            className="my-auto box-border max-h-[calc(100vh-80px)] w-full min-w-0 max-w-[520px] overflow-hidden overflow-y-auto rounded-xl border border-line bg-elevated p-7 shadow-card"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            {title && (
              <h2 className="m-0 mb-[22px] text-[22px] font-bold tracking-[-0.03em] text-fg">
                {title}
              </h2>
            )}
            <div className="flex w-full flex-wrap justify-between gap-3.5">
              {addEquipmentData.map(renderInput)}
            </div>
            <div className="mt-[22px] flex w-full flex-row justify-end gap-3 border-t border-line pt-[18px]">
              <Button
                variant="secondary"
                className="min-w-[110px]"
                onClick={() => {
                  setShow(false);
                  setData(defaultData);
                  setEditData(null);
                }}
              >
                Отменить
              </Button>
              <Button className="min-w-[120px]" onClick={handleSave}>
                Сохранить
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ModalAddObject;
