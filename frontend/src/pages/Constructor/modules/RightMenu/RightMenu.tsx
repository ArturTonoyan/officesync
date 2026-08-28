import { useEffect, useState } from "react";
import styles from "./RightMenu.module.scss";
import arrow from "@assets/images/icons/arrow.svg";
import { inputs } from "./data";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@store/hooks";
import {
  setDataBySelected,
  deleteObject,
} from "../../../../store/convaSlice/conva.Slice";
import {
  apiDeleteElement,
  apiGetReservedsElements,
  apiGetUsers,
} from "../../../../api/apirequests";
import { useQuery } from "@tanstack/react-query";
function RightMenu({ setModalAddEquipment, setEditItem }) {
  const dispatch = useDispatch();
  const user = useAppSelector((state) => state.user.user.data);
  const item = useAppSelector((state) => state.conva.objects.selectedObject);
  const [openMenu, setOpenMenu] = useState(true);
  const [editData, setEditData] = useState(null);
  const [value, setValue] = useState("");
  const [reserveds, setReserved] = useState([]);

  const funChangeData = (key, value) => {
    dispatch(setDataBySelected({ key, value }));
  };

  const funDelete = () => {
    apiDeleteElement(item.id).then((res) => {
      if (res.status === 200) {
        dispatch(deleteObject(item.id));
      }
    });
  };

  useEffect(() => {
    if (item?.id) {
      apiGetReservedsElements(item?.id).then((res) => {
        if (res?.status === 200) {
          setReserved(res?.data);
        }
      });
    }
  }, [item?.id]);

  const { data: users } = useQuery({
    queryKey: ["users/all/id", user?.companyId],
    queryFn: () => apiGetUsers(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  return (
    <div
      className={`${styles.RightMenu} ${
        !openMenu ? styles.RightMenuClose : ""
      }`}
    >
      <div className={styles.head}>
        <img
          src={arrow}
          alt="arrow"
          onClick={() => setOpenMenu(!openMenu)}
          className={!openMenu ? styles.rotate : ""}
        />
        <h3>Параметры объекта</h3>
      </div>
      {item?.id && (
        <>
          <div className={styles.position}>
            {inputs.map((el, index) => (
              <div className={styles.input_box} name={el.key} key={index}>
                <span className={styles.name}>{el.name}</span>
                <div className={styles.input}>
                  <input
                    key={index}
                    type={el.type}
                    autoComplete="new-password"
                    value={
                      editData === index
                        ? value
                        : Number(item?.[el.key])?.toFixed(2)
                    }
                    onFocus={() => {
                      setEditData(index);
                      setValue(item?.[el.key]);
                    }}
                    onBlur={() => {
                      setEditData(null);
                      funChangeData(el.key, value);
                    }}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {item?.id && (
        <div className={styles.object_info}>
          <h4>Информация елемента</h4>
          <div className={styles.scroll}>
            <div className={styles.object_info_container}>
              <h4>Объект</h4>
              <div className={styles.text_box}>
                <span className={styles.name}>Название</span>
                <span className={styles.value}>{item?.name}</span>
              </div>
              <div className={styles.text_box}>
                <span className={styles.name}>Тип</span>
                <span className={styles.value}>{item?.type}</span>
              </div>
              <div className={styles.text_box}>
                <span className={styles.name}>Закреплен за:</span>
                <span className={styles.value}>
                  {(users?.data?.find((i) => i.id === item?.userId)?.name ||
                    "") +
                    " " +
                    (users?.data?.find((i) => i.id === item?.userId)?.surname ||
                      "") +
                    " " +
                    (users?.data?.find((i) => i.id === item?.userId)
                      ?.patronymic || "")}
                </span>
              </div>
              {reserveds?.length > 0 && <h4>Бронирования</h4>}
              {reserveds.map((item, index) => (
                <div className={styles.text_box} key={index}>
                  <span className={styles.name}>Бронь {index + 1}</span>
                  <span className={styles.value}>Дата: {item?.date}</span>

                  <span className={styles.value}>
                    Время: {item?.startTime?.slice(0, 5)} -{" "}
                    {item?.endTime?.slice(0, 5)}
                  </span>
                  <span className={styles.value}>
                    Пользователь:{" "}
                    {item?.user?.surname +
                      " " +
                      item?.user?.name +
                      " " +
                      item?.user?.patronymic}
                  </span>
                </div>
              ))}
              {item?.equipment && (
                <div className={styles.equipment_block}>
                  <h4>Оборудование</h4>
                  <div className={styles.text_box}>
                    <span className={styles.name}>Название</span>
                    <span className={styles.value}>
                      {item?.equipment?.name}
                    </span>
                  </div>
                  <div className={styles.text_box}>
                    <span className={styles.name}>Инв. номер</span>
                    <span className={styles.value}>
                      {" "}
                      {item?.equipment?.inventoryNumber}
                    </span>
                  </div>
                  <div className={styles.text_box}>
                    <span className={styles.name}>Цена</span>
                    <span className={styles.value}>
                      {item?.equipment?.cost} руб
                    </span>
                  </div>
                  <div className={styles.text_box}>
                    <span className={styles.name}>Описание</span>
                    <span className={styles.value}>
                      {item?.equipment?.description}
                    </span>
                  </div>
                  <div className={styles.text_box}>
                    <span className={styles.name}>Наработка</span>
                    <span className={styles.value}>
                      {item?.equipment?.currentWarranty} /{" "}
                      {item?.equipment?.maxWarranty}
                    </span>
                  </div>
                  <div className={styles.text_box}>
                    <h4>Сотрудник</h4>
                    <span className={styles.value}>
                      {item?.equipment?.user?.surname +
                        " " +
                        item?.equipment?.user?.name +
                        " " +
                        item?.equipment?.user?.patronymic +
                        " " +
                        item?.equipment?.user?.email}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {item?.id && (
        <div className={styles.actions}>
          <h4>Действия</h4>
          <div className={styles.actions_container}>
            <button onClick={funDelete} className={styles.delete}>
              Удалить
            </button>
            <button
              onClick={() => {
                setModalAddEquipment(true);
                setEditItem(item);
              }}
              className={styles.edit}
            >
              Редактировать
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RightMenu;
