import { nav } from "./data";
import styles from "./Header.module.scss";
import logo from "@assets/images/logo/logo.svg";
import { useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();
  return (
    <div className={styles.Header}>
      <div className={styles.logo}>
        <img src={logo} alt="logo" />
      </div>
      <div className={styles.nav}>
        {nav.map((item, index) => (
          <a key={index} href={item.link}>
            {item.name}
          </a>
        ))}
      </div>
      <div className={styles.auth}>
        <button onClick={() => navigate("/authorization")}>Войти</button>
      </div>
    </div>
  );
}

export default Header;
