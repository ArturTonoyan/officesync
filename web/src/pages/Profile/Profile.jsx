import { Outlet } from "react-router-dom";
import LeftMenu from "./LeftMenu/LeftMenu";
import styles from "./Profile.module.scss";

function Profile() {
  return (
    <div className={styles.Profile}>
      <LeftMenu />
      <div className={styles.container}>
        <Outlet />
      </div>
    </div>
  );
}

export default Profile;
