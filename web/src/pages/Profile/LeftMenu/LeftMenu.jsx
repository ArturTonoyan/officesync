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
import { useSelector } from "react-redux";
function LeftMenu() {
  const user = useSelector((state) => state.user.user.data);
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
      title: "Неполадки",
      navigate: "/admin/problems",
    },
    {
      icon: errorsIcon,
      title: "ТО",
      navigate: "/admin/to",
    },
  ];

  return (
    <div className={styles.LeftMenu}>
      <div className={styles.logotype}>
        <img src={logoIcon} alt="Логотип" onClick={() => navigate("/")} />
      </div>
      <div className={styles.profile_data}>
        <div className={styles.profile_img}>
          <img src="./img/men.png" alt="Логотип" />
        </div>
        <div className={styles.fio}>
          <p
            className={styles.fio_text}
          >{`${user?.surname} ${user?.name} ${user?.patronymic}`}</p>
          <span className={styles.email}>{user?.email}</span>
          <span className={styles.position}>{user?.position}</span>
        </div>
        <div className={styles.buttons}>
          <button className={styles.edit}>
            <img src="./img/icons/edit.svg" alt="edit" />
          </button>
        </div>
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
        </div>
      </div>
    </div>
  );
}

export default LeftMenu;
