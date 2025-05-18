import { useState } from "react";
import styles from "./Table.module.scss";
import ParamContextMenu from "../ParamContextMenu/ParamContextMenu";
import { server } from "../../api/apirequests";

function Table({
  prewData,
  tableData,
  setTableData,
  setModalShow,
  paramMenu,
  tableHeader,
  funClick,
}) {
  const [openList, setOpenList] = useState(null);

  const getTdData = (key, row) => {
    if (key === "imageUrl" || key === "image")
      return row[key] ? (
        <img
          className={styles.imgUrl}
          src={row[key]}
          alt="img"
          onClick={() => {
            //! скачивание фото или файла
            const link = document.createElement("a");
            link.href = row[key];
            link.target = "_blank";

            link.click();
          }}
        />
      ) : (
        <>Нет фото</>
      );
    if (key === "contract") {
      return row[key] ? (
        <span
          onClick={() => {
            const link = document.createElement("a");
            link.href = `${server}/${row[key]}`;
            link.target = "_blank";
            link.click();
          }}
        >
          {row[key]}
        </span>
      ) : (
        <>Нет контакта</>
      );
    }
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
                  funClick={funClick}
                  row={row}
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
