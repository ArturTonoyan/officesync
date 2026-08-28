import { useNavigate } from "react-router-dom";
import { apiLogin } from "../../../api/apirequests";
import HeadLogo from "../../../modules/HeadLogo/HeadLogo";
import styles from "./Authorization.module.scss";
import { inputs } from "./data";
import { useState } from "react";

function Authorization({ funUpdUser }) {
  const navigate = useNavigate();

  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const funSetData = (key, value) => {
    setData({ ...data, [key]: value });
  };

  const funSave = () => {
    apiLogin(data).then((res) => {
      if (res.status === 201) {
        navigate("/");
        funUpdUser();
      }
    });
  };
  return (
    <div className={styles.Authorization}>
      <HeadLogo />
      <div className={styles.container}>
        <h1>Авторизация</h1>
        <div className={styles.auth}>
          <span>Еще не зарегистрированы?</span>
          <a href="/registration">Регистрация</a>
        </div>
        <div className={styles.form}>
          {inputs.map((item, index) => (
            <div className={styles.input_box} name={item.key}>
              <input
                key={index}
                type={item.type}
                placeholder={item.name}
                autoComplete="new-password"
                value={data[item.key]}
                onChange={(e) => funSetData(item.key, e.target.value)}
              />
            </div>
          ))}
          <button className={styles.save} onClick={funSave}>
            Войти
          </button>
        </div>
      </div>
    </div>
  );
}

export default Authorization;
