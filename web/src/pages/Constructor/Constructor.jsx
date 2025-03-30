import styles from "./Constructor.module.scss";
import ConvasSpace from "./modules/ConvasSpace/ConvasSpace";

function Constructor() {
  return (
    <div className={styles.Constructor}>
      <ConvasSpace />
    </div>
  );
}

export default Constructor;
