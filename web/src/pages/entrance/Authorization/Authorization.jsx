import HeadLogo from "../../../modules/HeadLogo/HeadLogo";
import styles from "./Authorization.module.scss";
import { inputs } from "./data";

function Authorization() {
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
              />
            </div>
          ))}
          <button className={styles.save}>Войти</button>
        </div>
      </div>
    </div>
  );
}

export default Authorization;
