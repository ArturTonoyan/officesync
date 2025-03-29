import styles from "./HeadLogo.module.scss";
import logo from "@assets/images/logo/logo.svg";

function HeadLogo() {
  return (
    <div className={styles.HeadLogo}>
      <img src={logo} alt="logo" />
    </div>
  );
}

export default HeadLogo;
