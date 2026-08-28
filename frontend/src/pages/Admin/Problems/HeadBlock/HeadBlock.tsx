import styles from "./HeadBlock.module.scss";
import lupa from "@assets/images/icons/lupa.svg";
import { handleExportExcel } from "../../../../utils/functions/funcions";

function HeadBlock({
  tableData,
  tableHeader,
  shearchParam,
  setShearchParam,
  setModalShow,
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
        <button className={styles.save} onClick={() => setModalShow(true)}>
          + Создать заявку на ремонт
        </button>
      </div>
    </div>
  );
}

export default HeadBlock;
