import { useEffect, useState } from "react";
import styles from "./Offices.module.scss";
import { addOfficeData, paramMenu, tableHeader, testData } from "./data";
import HeadBlock from "./HeadBlock/HeadBlock";
import ModalAddOfice from "../../../modules/ModalAddOfice/ModalAddOfice";
import Table from "../../../modules/Table/Table";

function Offices() {
  const [originalData, setOriginalData] = useState(testData);
  const [tableData, setTableData] = useState(testData);
  const [shearchParam, setShearchParam] = useState("");
  const [modalShow, setModalShow] = useState(false);

  //! поиск по всем полям
  useEffect(() => {
    if (shearchParam.trim() !== "") {
      const filteredData = originalData.filter((item) =>
        Object.values(item).some((value) =>
          value.toString().toLowerCase().includes(shearchParam.toLowerCase())
        )
      );
      setTableData(filteredData);
    } else {
      setTableData([...originalData]); // Сбрасываем фильтр
    }
  }, [shearchParam, originalData]);

  return (
    <div className={styles.Offices}>
      <h1>Офисы</h1>
      <ModalAddOfice
        show={modalShow}
        setShow={setModalShow}
        title={"Добавить офис"}
        inputs={addOfficeData}
      />
      <HeadBlock
        setModalShow={setModalShow}
        shearchParam={shearchParam}
        setShearchParam={setShearchParam}
      />
      <div className={styles.content}>
        <Table
          prewData={[]}
          tableData={tableData}
          setTableData={setTableData}
          direction={[]}
          setModalShow={setModalShow}
          paramMenu={paramMenu}
          tableHeader={tableHeader}
        />
      </div>
    </div>
  );
}

export default Offices;
