import logoIcon from "@assets/images/logo/logo.svg";
import companyIcon from "@assets/images/leftMenu/company.svg";
import officeIcon from "@assets/images/leftMenu/office.svg";
import catalogIcon from "@assets/images/leftMenu/catalog.svg";
import bookingIcon from "@assets/images/leftMenu/booking.svg";
import deviceIcon from "@assets/images/leftMenu/device.svg";
import errorsIcon from "@assets/images/leftMenu/errors.svg";
import maintenanceIcon from "@assets/images/leftMenu/maintenance.svg";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "@store/hooks";
import editIcon from "@assets/images/icons/editProfile.svg";
import exit from "@assets/images/icons/exit.svg";
import nophoto from "@assets/images/icons/noavatar.jpg";
import { apiUpdateUserProfile, server } from "../../../api/apirequests";
import ModalAddOfice from "../../../modules/ModalAddOfice/ModalAddOfice";
import { addOfficeData } from "./data";
import { useState } from "react";
import { cn } from "@utils/cn";

const navItemBase =
  "mb-0.5 flex cursor-pointer list-none items-center rounded-[10px] px-2.5 py-2 transition-colors hover:bg-bg2 [&_img]:mr-2.5 [&_img]:h-4 [&_img]:w-4 [&_img]:shrink-0 [&_img]:opacity-50 [&_span]:m-0 [&_span]:p-0 [&_span]:text-[13px] [&_span]:font-medium [&_span]:leading-[1.3] [&_span]:tracking-[-0.01em] [&_span]:text-[#4a4a4e]";

const navItemActive =
  "bg-[#ececed] hover:bg-[#ececed] [&_img]:opacity-90 [&_span]:font-semibold [&_span]:text-fg";

function LeftMenu({ funUpdUser }) {
  const user = useAppSelector((state) => state.user.user.data);
  const navigate = useNavigate();
  const location = useLocation();

  const [modalEditShow, setModalEditShow] = useState(false);
  const [modalEditData, setModalEditData] = useState({});

  const funUpdate = () => {
    const formData = new FormData();
    const fields = {
      name: modalEditData.name,
      surname: modalEditData.surname,
      patronymic: modalEditData.patronymic,
      email: modalEditData.email,
      position: modalEditData.position,
      image: modalEditData.photo,
    };
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    apiUpdateUserProfile(formData).then((res) => {
      if (res.status === 200) {
        setModalEditShow(false);
        funUpdUser();
      }
    });
  };

  const isAdmin = user?.roles?.some((role) => role.value === "ADMIN");

  const listMenu = [
    ...(isAdmin
      ? [
          {
            icon: officeIcon,
            title: "Админ-панель",
            navigate: "/admin",
          },
        ]
      : []),
    {
      icon: companyIcon,
      title: "Компания",
      navigate: "/profile",
    },
    {
      icon: catalogIcon,
      title: "Каталог",
      navigate: "/catalog",
    },
    {
      icon: bookingIcon,
      title: "Бронирование",
      navigate: "/profile/reservation",
    },
    {
      icon: deviceIcon,
      title: "Оборудование",
      navigate: "/profile/equipments",
    },
    {
      icon: errorsIcon,
      title: "Заявки на ремонт",
      navigate: "/profile/problems",
    },
    {
      icon: maintenanceIcon,
      title: "ТО",
      navigate: "/profile/to",
    },
  ];

  const funClickEdit = () => {
    setModalEditData(user);
    setModalEditShow(true);
  };

  return (
    <>
      <ModalAddOfice
        show={modalEditShow}
        setShow={setModalEditShow}
        title={"Редактировать данные профиля"}
        inputs={addOfficeData}
        data={modalEditData}
        setData={setModalEditData}
        funSave={funUpdate}
      />

      <div className="scrollbar-thin fixed top-0 left-0 z-[100] box-border flex h-screen w-[248px] flex-col overflow-y-auto border-r border-line bg-elevated px-3 pt-[18px] pb-5">
        <div className="px-2 pt-1.5 pb-[18px] [&_img]:block [&_img]:h-[26px] [&_img]:w-auto [&_img]:max-w-full [&_img]:cursor-pointer">
          <img src={logoIcon} alt="Логотип" onClick={() => navigate("/")} />
        </div>
        <div className="mb-4 flex w-full flex-col items-center rounded-md border border-line bg-bg px-2.5 py-3.5">
          <div className="mb-2.5">
            {user?.image ? (
              <img
                className="h-16 w-16 rounded-full border border-line object-cover"
                src={`${server}/${user?.image}`}
                alt="Логотип"
              />
            ) : (
              <img
                className="h-16 w-16 rounded-full border border-line object-cover opacity-50"
                src={nophoto}
                alt="Логотип"
              />
            )}
          </div>
          <div className="flex flex-col items-center">
            <p className="mb-0.5 text-center text-[13px] font-semibold tracking-[-0.01em] text-fg leading-[1.3]">{`${user?.surname} ${user?.name} ${user?.patronymic}`}</p>
            <span className="mb-0.5 text-center text-[11px] leading-[1.35] text-fg-secondary">
              {user?.email}
            </span>
            <span className="mb-0.5 text-center text-[11px] leading-[1.35] text-fg-secondary">
              {user?.position}
            </span>
          </div>
          <div className="mt-2.5 flex flex-row gap-1.5">
            <button
              type="button"
              className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-sm border border-line bg-elevated transition-colors hover:bg-bg2"
              onClick={() => navigate("/authorization")}
            >
              <img className="h-3.5 w-3.5 object-cover" src={exit} alt="edit" />
            </button>
            <button
              type="button"
              className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-sm border border-line bg-elevated transition-colors hover:bg-bg2"
              onClick={funClickEdit}
            >
              <img className="h-3.5 w-3.5 object-cover" src={editIcon} alt="exit" />
            </button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-between">
          <div className="flex flex-col">
            <div className="mt-1">
              <span className="block px-2.5 pb-2 text-[10px] font-semibold tracking-[0.08em] text-fg-muted uppercase">
                Меню
              </span>
              <ul className="m-0 list-none p-0">
                {listMenu.map((item) => {
                  const active =
                    item.navigate === "/profile"
                      ? location.pathname === "/profile" ||
                        location.pathname === "/profile/"
                      : location.pathname.startsWith(item.navigate);
                  return (
                    <li
                      key={item.navigate}
                      className={cn(navItemBase, active && navItemActive)}
                      onClick={() => navigate(item.navigate)}
                    >
                      <img src={item.icon} alt="" />
                      <span>{item.title}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default LeftMenu;