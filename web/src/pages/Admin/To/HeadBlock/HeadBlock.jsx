import styles from "./HeadBlock.module.scss";
import { handleExportExcel } from "../../../../utils/functions/funcions";
import lupa from "@assets/images/icons/lupa.svg";

function HeadBlock({
  tableData,
  tableHeader,
  shearchParam,
  setShearchParam,
  setModalShow,
  noedit,
}) {
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
      <div className={styles.right_block}>
        <button
          className={styles.save}
          style={{ marginRight: "15px" }}
          onClick={() => handleExportExcel(tableData, tableHeader)}
        >
          📁 Экспорт в Excel
        </button>
        {!noedit && (
          <button className={styles.save} onClick={() => setModalShow(true)}>
            + Добавить то
          </button>
        )}
      </div>
    </div>
  );
}

export default HeadBlock;
