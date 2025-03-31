import styles from "./TopMenu.module.scss";
import logo from "@assets/images/logo/logo.svg";
import { useNavigate } from "react-router-dom";
import arrow from "@assets/images/icons/arrowMini.svg";

function TopMenu() {
  const navigate = useNavigate();
  return (
    <div className={styles.TopMenu}>
      <div className={styles.icon} onClick={() => navigate("/")}>
        <img src={logo} alt="logo" />
      </div>
      <div className={styles.office}>
        <button>
          <span>Офис Чехова 1</span>
          <img src={arrow} alt="arrow" />
        </button>
        <button>
          <span>Этаж 1</span>
          <img src={arrow} alt="arrow" />
        </button>
      </div>
      <div className={styles.param}>
        <button>Сохранить</button>
      </div>
    </div>
  );
}

export default TopMenu;
