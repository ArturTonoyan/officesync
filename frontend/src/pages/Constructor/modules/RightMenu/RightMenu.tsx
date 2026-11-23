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
import { useEffect, useState } from "react";
import { cn } from "@utils/cn";
import { Button, Input } from "@components/ui";

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
      className={cn(
        "fixed top-[110px] right-0 z-[90] h-[77vh] w-[300px] bg-white transition-all duration-150 ease-linear",
        !openMenu && "!right-[-240px]",
      )}
    >
      <div className="flex flex-row items-center pl-5">
        <img
          src={arrow}
          alt="arrow"
          onClick={() => setOpenMenu(!openMenu)}
          className={cn(
            "h-6 w-6 cursor-pointer scale-x-[-1] transition-all duration-150 ease-linear hover:opacity-60 active:opacity-100",
            !openMenu && "scale-x-[1]",
          )}
        />
        <h3 className="m-0 p-5 text-lg font-medium text-fg-secondary">
          Параметры объекта
        </h3>
      </div>
      {item?.id && (
        <>
          <div className="flex flex-wrap justify-between p-5 pt-2.5">
            {inputs.map((el, index) => (
              <div
                className="flex h-10 w-[110px] flex-row items-center rounded-sm border border-line bg-elevated p-2.5 shadow-soft transition-[border-color,box-shadow] focus-within:border-fg focus-within:shadow-[0_0_0_3px_rgba(17,17,17,0.06)]"
                name={el.key}
                key={index}
              >
                <span className="mr-2.5 text-[13px] text-fg-secondary">
                  {el.name}
                </span>
                <Input
                  bare
                  key={index}
                  type={el.type}
                  autoComplete="new-password"
                  className="h-full w-20 text-center"
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
            ))}
          </div>
        </>
      )}
      {item?.id && (
        <div className="pb-2.5">
          <h4 className="m-0 p-5 text-lg font-medium text-fg-secondary">
            Информация елемента
          </h4>
          <div className="mr-4 max-h-[32vh] overflow-y-auto">
            <div className="px-5">
              <h4 className="m-0 p-0 pl-0 text-base font-medium text-black after:mb-1.5 after:block after:h-px after:w-full after:bg-black after:content-['']">
                Объект
              </h4>
              <div className="flex flex-col pb-1.5">
                <span className="pb-0.5 text-base font-medium text-black">
                  Название
                </span>
                <span className="pl-2.5 text-base font-normal text-[#656565] before:pr-2.5 before:content-['•']">
                  {item?.name}
                </span>
              </div>
              <div className="flex flex-col pb-1.5">
                <span className="pb-0.5 text-base font-medium text-black">
                  Тип
                </span>
                <span className="pl-2.5 text-base font-normal text-[#656565] before:pr-2.5 before:content-['•']">
                  {item?.type}
                </span>
              </div>
              <div className="flex flex-col pb-1.5">
                <span className="pb-0.5 text-base font-medium text-black">
                  Закреплен за:
                </span>
                <span className="pl-2.5 text-base font-normal text-[#656565] before:pr-2.5 before:content-['•']">
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
              {reserveds?.length > 0 && (
                <h4 className="m-0 p-0 pl-0 text-base font-medium text-black after:mb-1.5 after:block after:h-px after:w-full after:bg-black after:content-['']">
                  Бронирования
                </h4>
              )}
              {reserveds.map((item, index) => (
                <div className="flex flex-col pb-1.5" key={index}>
                  <span className="pb-0.5 text-base font-medium text-black">
                    Бронь {index + 1}
                  </span>
                  <span className="pl-2.5 text-base font-normal text-[#656565] before:pr-2.5 before:content-['•']">
                    Дата: {item?.date}
                  </span>

                  <span className="pl-2.5 text-base font-normal text-[#656565] before:pr-2.5 before:content-['•']">
                    Время: {item?.startTime?.slice(0, 5)} -{" "}
                    {item?.endTime?.slice(0, 5)}
                  </span>
                  <span className="pl-2.5 text-base font-normal text-[#656565] before:pr-2.5 before:content-['•']">
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
                <div>
                  <h4 className="m-0 p-0 pl-0 text-base font-medium text-black after:mb-1.5 after:block after:h-px after:w-full after:bg-black after:content-['']">
                    Оборудование
                  </h4>
                  <div className="flex flex-col pb-1.5">
                    <span className="pb-0.5 text-base font-medium text-black">
                      Название
                    </span>
                    <span className="pl-2.5 text-base font-normal text-[#656565] before:pr-2.5 before:content-['•']">
                      {item?.equipment?.name}
                    </span>
                  </div>
                  <div className="flex flex-col pb-1.5">
                    <span className="pb-0.5 text-base font-medium text-black">
                      Инв. номер
                    </span>
                    <span className="pl-2.5 text-base font-normal text-[#656565] before:pr-2.5 before:content-['•']">
                      {" "}
                      {item?.equipment?.inventoryNumber}
                    </span>
                  </div>
                  <div className="flex flex-col pb-1.5">
                    <span className="pb-0.5 text-base font-medium text-black">
                      Цена
                    </span>
                    <span className="pl-2.5 text-base font-normal text-[#656565] before:pr-2.5 before:content-['•']">
                      {item?.equipment?.cost} руб
                    </span>
                  </div>
                  <div className="flex flex-col pb-1.5">
                    <span className="pb-0.5 text-base font-medium text-black">
                      Описание
                    </span>
                    <span className="pl-2.5 text-base font-normal text-[#656565] before:pr-2.5 before:content-['•']">
                      {item?.equipment?.description}
                    </span>
                  </div>
                  <div className="flex flex-col pb-1.5">
                    <span className="pb-0.5 text-base font-medium text-black">
                      Наработка
                    </span>
                    <span className="pl-2.5 text-base font-normal text-[#656565] before:pr-2.5 before:content-['•']">
                      {item?.equipment?.currentWarranty} /{" "}
                      {item?.equipment?.maxWarranty}
                    </span>
                  </div>
                  <div className="flex flex-col pb-1.5">
                    <h4 className="m-0 p-0 pl-0 text-base font-medium text-black after:mb-1.5 after:block after:h-px after:w-full after:bg-black after:content-['']">
                      Сотрудник
                    </h4>
                    <span className="pl-2.5 text-base font-normal text-[#656565] before:pr-2.5 before:content-['•']">
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
        <div className="flex flex-col">
          <h4 className="m-0 p-5 text-lg font-medium text-fg-secondary">
            Действия
          </h4>
          <div className="flex flex-col px-5 py-2.5">
            <Button
              variant="secondary"
              onClick={funDelete}
              className="w-full rounded-md border !border-[#b32020] bg-transparent text-[#b32020] hover:bg-tag-red-bg"
            >
              Удалить
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setModalAddEquipment(true);
                setEditItem(item);
              }}
              className="mt-2.5 w-full rounded-md text-sm font-normal"
            >
              Редактировать
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RightMenu;