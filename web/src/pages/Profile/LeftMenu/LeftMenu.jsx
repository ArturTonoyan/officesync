import styles from "./LeftMenu.module.scss";
import logoIcon from "@assets/images/logo/logo.svg";
import officeIcon from "@assets/images/leftMenu/office.svg";
import deviceIcon from "@assets/images/leftMenu/device.svg";
import errorsIcon from "@assets/images/leftMenu/errors.svg";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import editIcon from "@assets/images/icons/editProfile.svg";
import exit from "@assets/images/icons/exit.svg";
import nophoto from "@assets/images/icons/noavatar.jpg";
import { apiUpdateUserProfile, server } from "../../../api/apirequests";
import ModalAddOfice from "../../../modules/ModalAddOfice/ModalAddOfice";
import { addOfficeData } from "./data";
import { useState } from "react";

function LeftMenu({ funUpdUser }) {
  const user = useSelector((state) => state.user.user.data);
  const navigate = useNavigate();

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

  const listMenu = [
    {
      icon: officeIcon,
      title: "Компания",
      navigate: "/profile",
    },
    {
      icon: officeIcon,
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
      title: "Неполадки",
      navigate: "/profile/problems",
    },
    {
      icon: errorsIcon,
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
        // lists={{
        //   office: {
        //     data: offices?.data,
        //     key: "officeId",
        //     value: ["name", "address"],
        //   },
        //   floor: {
        //     data: floors?.data,
        //     key: "floorId",
        //     value: ["name", "address"],
        //   },
        //   user: {
        //     data: users?.data,
        //     key: "userId",
        //     value: ["name", "surname", "patronymic", "email"],
        //   },
        // }}
      />

      <div className={styles.LeftMenu}>
        <div className={styles.logotype}>
          <img src={logoIcon} alt="Логотип" onClick={() => navigate("/")} />
        </div>
        <div className={styles.profile_data}>
          <div className={styles.profile_img}>
            {user?.image ? (
              <img src={`${server}/${user?.image}`} alt="Логотип" />
            ) : (
              <img style={{ opacity: "0.5" }} src={nophoto} alt="Логотип" />
            )}
          </div>
          <div className={styles.fio}>
            <p
              className={styles.fio_text}
            >{`${user?.surname} ${user?.name} ${user?.patronymic}`}</p>
            <span className={styles.email}>{user?.email}</span>
            <span className={styles.position}>{user?.position}</span>
          </div>
          <div className={styles.buttons}>
            <button
              className={styles.edit}
              onClick={() => navigate("/authorization")}
            >
              <img src={exit} alt="edit" />
            </button>
            <button className={styles.edit} onClick={funClickEdit}>
              <img src={editIcon} alt="exit" />
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
    </>
  );
}

export default LeftMenu;
