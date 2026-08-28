import { useNavigate } from "react-router-dom";
import styles from "./HeadLogo.module.scss";
import logo from "@assets/images/logo/logo.svg";

function HeadLogo() {
  const navigate = useNavigate();
  return (
    <div className={styles.HeadLogo}>
      <img
        src={logo}
        style={{ cursor: "pointer" }}
        alt="logo"
        onClick={() => navigate("/")}
      />
    </div>
  );
}

export default HeadLogo;
