import logoIcon from "@assets/images/logo/logo.svg";
import companyIcon from "@assets/images/leftMenu/company.svg";
import officeIcon from "@assets/images/leftMenu/office.svg";
import floorsIcon from "@assets/images/leftMenu/floors.svg";
import deviceIcon from "@assets/images/leftMenu/device.svg";
import personsIcon from "@assets/images/leftMenu/persons.svg";
import errorsIcon from "@assets/images/leftMenu/errors.svg";
import maintenanceIcon from "@assets/images/leftMenu/maintenance.svg";
import analyticsIcon from "@assets/images/leftMenu/analytics.svg";
import chatIcon from "@assets/images/leftMenu/chat.svg";
import catalogIcon from "@assets/images/leftMenu/catalog.svg";
import constructorIcon from "@assets/images/leftMenu/constructor.svg";
import userIcon from "@assets/images/leftMenu/user.svg";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@utils/cn";

const navItemClass =
  "mb-0.5 flex cursor-pointer list-none items-center rounded-[10px] px-2.5 py-2 transition-colors hover:bg-bg2";
const navItemActiveClass =
  "bg-[#ececed] hover:bg-[#ececed] [&_img]:opacity-90 [&_span]:font-semibold [&_span]:text-fg";

function LeftMenu() {
  const navigate = useNavigate();
  const location = useLocation();

  const listMenu = [
    {
      icon: companyIcon,
      title: "Компания",
      navigate: "/admin",
    },
    {
      icon: officeIcon,
      title: "Офисы",
      navigate: "/admin/offices",
    },
    {
      icon: floorsIcon,
      title: "Этажи",
      navigate: "/admin/floors",
    },
    {
      icon: personsIcon,
      title: "Сотрудники",
      navigate: "/admin/users",
    },
    {
      icon: deviceIcon,
      title: "Оборудование",
      navigate: "/admin/equipments",
    },
    {
      icon: errorsIcon,
      title: "Заявки на ремонт",
      navigate: "/admin/problems",
    },
    {
      icon: maintenanceIcon,
      title: "ТО",
      navigate: "/admin/to",
    },
    {
      icon: analyticsIcon,
      title: "Аналитика",
      navigate: "/admin/analytics",
    },
    {
      icon: chatIcon,
      title: "AI-чат",
      navigate: "/admin/chat",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin" || location.pathname === "/admin/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="scrollbar-thin fixed left-0 top-0 z-[100] box-border flex h-screen w-[248px] flex-col overflow-y-auto border-r border-line bg-white px-3 pb-5 pt-[18px]">
      <div className="px-2 pb-[18px] pt-1.5">
        <img
          src={logoIcon}
          alt="OfficeSync"
          className="block h-[26px] w-auto max-w-full cursor-pointer"
          onClick={() => navigate("/")}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <div className="flex flex-col">
          <div className="mt-0.5">
            <span className="mb-2 block px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
              Управление
            </span>
            <ul className="m-0 list-none p-0">
              {listMenu.map((item) => (
                <li
                  key={item.navigate}
                  className={cn(
                    navItemClass,
                    isActive(item.navigate) && navItemActiveClass,
                  )}
                  onClick={() => navigate(item.navigate)}
                >
                  <img
                    src={item.icon}
                    alt=""
                    className="mr-2.5 h-4 w-4 shrink-0 opacity-50"
                  />
                  <span className="m-0 p-0 text-[13px] font-medium leading-[1.3] tracking-[-0.01em] text-[#4a4a4e]">
                    {item.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-[18px] border-t border-line pt-4">
            <span className="mb-2 block px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
              Инструменты
            </span>
            <ul className="m-0 list-none p-0">
              <li
                className={cn(
                  navItemClass,
                  location.pathname.startsWith("/catalog") && navItemActiveClass,
                )}
                onClick={() => navigate("/catalog")}
              >
                <img
                  src={catalogIcon}
                  alt=""
                  className="mr-2.5 h-4 w-4 shrink-0 opacity-50"
                />
                <span className="m-0 p-0 text-[13px] font-medium leading-[1.3] tracking-[-0.01em] text-[#4a4a4e]">
                  Каталог
                </span>
              </li>
              <li
                className={cn(
                  navItemClass,
                  location.pathname.startsWith("/constructor") &&
                    navItemActiveClass,
                )}
                onClick={() => navigate("/constructor")}
              >
                <img
                  src={constructorIcon}
                  alt=""
                  className="mr-2.5 h-4 w-4 shrink-0 opacity-50"
                />
                <span className="m-0 p-0 text-[13px] font-medium leading-[1.3] tracking-[-0.01em] text-[#4a4a4e]">
                  Конструктор
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-[18px] border-t border-line pt-4">
          <ul className="m-0 list-none p-0">
            <li
              className={navItemClass}
              onClick={() => navigate("/profile")}
            >
              <img
                src={userIcon}
                alt=""
                className="mr-2.5 h-4 w-4 shrink-0 opacity-50"
              />
              <span className="m-0 p-0 text-[13px] font-medium leading-[1.3] tracking-[-0.01em] text-[#4a4a4e]">
                Профиль
              </span>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}

export default LeftMenu;