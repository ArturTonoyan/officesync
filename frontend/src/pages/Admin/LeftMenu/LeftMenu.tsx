import styles from "./LeftMenu.module.scss";
import logoIcon from "@assets/images/logo/logo.svg";
import officeIcon from "@assets/images/leftMenu/office.svg";
import deviceIcon from "@assets/images/leftMenu/device.svg";
import personsIcon from "@assets/images/leftMenu/persons.svg";
import errorsIcon from "@assets/images/leftMenu/errors.svg";
import constructorIcon from "@assets/images/leftMenu/constructor.svg";
import paramIcon from "@assets/images/leftMenu/param.svg";
import userIcon from "@assets/images/leftMenu/user.svg";
import { useNavigate } from "react-router-dom";
function LeftMenu() {
  const navigate = useNavigate();

  const listMenu = [
    {
      icon: officeIcon,
      title: "Компания",
      navigate: "/admin",
    },
    {
      icon: officeIcon,
      title: "Офисы",
      navigate: "/admin/offices",
    },
    {
      icon: officeIcon,
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
      icon: errorsIcon,
      title: "ТО",
      navigate: "/admin/to",
    },
    {
      icon: paramIcon,
      title: "Аналитика",
      navigate: "/admin/analytics",
    },
    {
      icon: paramIcon,
      title: "AI-чат",
      navigate: "/admin/chat",
    },
  ];

  return (
    <div className={styles.LeftMenu}>
      <div className={styles.logotype}>
        <img src={logoIcon} alt="Логотип" onClick={() => navigate("/")} />
      </div>
      <div className={styles.content}>
        <div className={styles.container}>
          <div className={styles.tables_box}>
            <span>Таблицы</span>
            <ul className={styles.list_item}>
              {listMenu.map((item, index) => (
                <li key={index} onClick={() => navigate(item.navigate)}>
                  <img src={item.icon} alt="img" />
                  <span>{item.title}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.constructor_box}>
            <ul className={styles.list_item}>
              <li onClick={() => navigate("/constructor")}>
                <img src={constructorIcon} alt="img" />
                <span>Конструктор</span>
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.container_bottom}>
          <ul className={styles.list_item}>
            <li onClick={() => navigate("/profile")}>
              <img src={userIcon} alt="img" />
              <span>Профиль</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LeftMenu;
