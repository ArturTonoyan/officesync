import styles from "./HeadBlock.module.scss";
import lupa from "@assets/images/icons/lupa.svg";

function HeadBlock({ shearchParam, setShearchParam, setModalShow, noedit }) {
  return (
    <div className={styles.HeadBlock}>
      <div className={styles.left_block}>
        <img src={lupa} alt="🔍" />
        <input
          value={shearchParam}
          onChange={(e) => setShearchParam(e.target.value)}
          type="text"
          placeholder="Поиск"
        />
      </div>
      {!noedit && (
        <div className={styles.right_block}>
          <button className={styles.save} onClick={() => setModalShow(true)}>
            + Добавить то
          </button>
        </div>
      )}
    </div>
  );
}

export default HeadBlock;
