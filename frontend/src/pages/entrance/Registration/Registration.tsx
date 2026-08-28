import { useState } from "react";
import HeadLogo from "../../../modules/HeadLogo/HeadLogo";
import { inputs } from "./data";
import styles from "./Registration.module.scss";
import { apiRegister } from "../../../api/apirequests";
import { useNavigate } from "react-router-dom";

function Registration({ funUpdUser }) {
  const navigate = useNavigate();
  const [data, setData] = useState({
    name: "",
    surname: "",
    patronymic: "",
    email: "",
    role: "USER",
    password: "",
    repeatPassword: "",
  });

  const funSetData = (key, value) => {
    setData({ ...data, [key]: value });
  };

  const funSave = () => {
    apiRegister(data).then((res) => {
      if (res.status === 201) {
        navigate("/");
        funUpdUser();
      }
    });
  };

  return (
    <div className={styles.Registration}>
      <HeadLogo />
      <div className={styles.container}>
        <h1>Регистрация</h1>
        <div className={styles.auth}>
          <span>Есть аккаунт?</span>
          <a href="/authorization">Войти</a>
        </div>
        <div className={styles.form}>
          {inputs.map((item, index) => (
            <div className={styles.input_box} name={item.key}>
              {item.key === "role" ? (
                <div className={styles.role}>
                  <button
                    onClick={() => funSetData("role", "ADMIN")}
                    className={data.role === "ADMIN" ? styles.active : ""}
                  >
                    Администратор
                  </button>
                  <button
                    onClick={() => funSetData("role", "USER")}
                    className={data.role === "USER" ? styles.active : ""}
                  >
                    Сотрудник
                  </button>
                </div>
              ) : (
                <input
                  key={index}
                  type={item.type}
                  placeholder={item.name}
                  autoComplete="new-password"
                  value={data[item.key]}
                  onChange={(e) => funSetData(item.key, e.target.value)}
                />
              )}
            </div>
          ))}
          <button className={styles.save} onClick={funSave}>
            Зарегистрироваться
          </button>
        </div>
      </div>
    </div>
  );
}

export default Registration;
