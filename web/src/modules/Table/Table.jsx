import { useState } from "react";
import styles from "./Table.module.scss";
import ParamContextMenu from "../ParamContextMenu/ParamContextMenu";

function Table({
  prewData,
  tableData,
  setTableData,
  setModalShow,
  paramMenu,
  tableHeader,
}) {
  const [openList, setOpenList] = useState(null);

  const getTdData = (key, row) => {
    return row[key];
  };

  return (
    <div className={styles.Table}>
      <table>
        <thead>
          <tr>
            {tableHeader.map((el, index) => (
              <th key={index}>{el.name}</th>
            ))}
            <th name="param">...</th>
          </tr>
        </thead>
        <tbody>
          {tableData?.map((row, indexRow) => (
            <tr key={indexRow}>
              <td>{indexRow + 1}</td>
              {tableHeader.slice(1).map((columnKey, indexCol) => (
                <td name={columnKey.key} key={indexCol}>
                  {getTdData(columnKey.key, row)}
                </td>
              ))}
              <td name="param">
                <button
                  className={styles.param}
                  onClick={() => setOpenList(indexRow)}
                >
                  ...
                </button>
                <ParamContextMenu
                  openList={openList === indexRow}
                  setOpenList={setOpenList}
                  paramMenu={paramMenu}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
