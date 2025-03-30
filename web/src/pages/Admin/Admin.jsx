import { Outlet } from "react-router-dom";
import styles from "./Admin.module.scss";
import LeftMenu from "./LeftMenu/LeftMenu";

function Admin() {
  return (
    <div className={styles.Admin}>
      <LeftMenu />
      <div className={styles.container}>
        <Outlet />
      </div>
    </div>
  );
}

export default Admin;
