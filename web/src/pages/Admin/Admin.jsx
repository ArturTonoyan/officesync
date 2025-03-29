import styles from "./Admin.module.scss";
import LeftMenu from "./LeftMenu/LeftMenu";

function Admin() {
  return (
    <div className={styles.Admin}>
      <LeftMenu />
    </div>
  );
}

export default Admin;
