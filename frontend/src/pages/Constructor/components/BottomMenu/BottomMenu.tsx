import styles from "./BottomMenu.module.scss";

function BottomMenu({ setModalAddEquipment }) {
  return (
    <div className={styles.BottomMenu}>
      <div className={styles.buttons}>
        <button
          className={styles.addEquipment}
          onClick={() => setModalAddEquipment(true)}
        >
          Добавить объект
        </button>
      </div>
    </div>
  );
}

export default BottomMenu;
