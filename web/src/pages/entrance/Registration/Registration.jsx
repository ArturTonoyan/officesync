import { useState } from "react";
import HeadLogo from "../../../modules/HeadLogo/HeadLogo";
import { inputs } from "./data";
import styles from "./Registration.module.scss";

function Registration() {
  const [role, setRole] = useState("USER");
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
                    onClick={() => setRole("ADMIN")}
                    className={role === "ADMIN" ? styles.active : ""}
                  >
                    Администратор
                  </button>
                  <button
                    onClick={() => setRole("USER")}
                    className={role === "USER" ? styles.active : ""}
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
                />
              )}
            </div>
          ))}
          <button className={styles.save}>Зарегистрироваться</button>
        </div>
      </div>
    </div>
  );
}

export default Registration;
