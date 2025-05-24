import { useSelector } from "react-redux";
import { nav } from "./data";
import styles from "./Header.module.scss";
import logo from "@assets/images/logo/logo.svg";
import { useNavigate } from "react-router-dom";

function Header() {
  const userEmail = useSelector((state) => state.user.user.data?.email);
  const userRole = useSelector(
    (state) => state.user.user.data?.roles?.[0]?.value
  );
  console.log("userRole", userRole);

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
        {userRole === "ADMIN" && (
          <a key={0} href="/admin">
            Главная
          </a>
        )}
      </div>
      <div className={styles.auth}>
        <button
          onClick={() => {
            userEmail ? navigate("/profile") : navigate("/authorization");
          }}
        >
          {userEmail ? "Личный кабинет" : "Вход"}
        </button>
      </div>
    </div>
  );
}

export default Header;
