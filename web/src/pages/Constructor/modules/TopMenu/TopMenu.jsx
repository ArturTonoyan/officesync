import styles from "./TopMenu.module.scss";
import logo from "@assets/images/logo/logo.svg";
import { useNavigate } from "react-router-dom";
import arrow from "@assets/images/icons/arrowMini.svg";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setSelectedFloor,
  setSelectedOffice,
} from "../../../../store/convaSlice/conva.Slice";
import { AnimatePresence, motion } from "framer-motion";

function TopMenu({ offices, floors, funSave, funDownload, noedit }) {
  const selectOffice = useSelector(
    (state) => state.conva.offices.selectedObject
  );
  const selectFloor = useSelector((state) => state.conva.floors.selectedObject);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [listShow, setListShow] = useState(null);

  const funLicstCLick = (item) => {
    if (item === listShow) {
      setListShow(null);
      return;
    }
    setListShow(item);
  };

  const funSelectOffice = (id) => {
    dispatch(setSelectedOffice({ id, offices: offices.data }));
    setListShow(null);
  };

  const funSelectFloor = (id) => {
    dispatch(setSelectedFloor({ id, floors: floors.data }));
    setListShow(null);
  };

  return (
    <div
      className={styles.TopMenu}
      style={
        noedit
          ? {
              background: "none",
              width: "max-content",
              backgroundColor: "inherit",
              left: "auto",
              right: "0",
            }
          : {}
      }
    >
      {!noedit && (
        <div className={styles.icon} onClick={() => navigate("/")}>
          <img src={logo} alt="logo" />
        </div>
      )}

      <div className={styles.office}>
        <div className={styles.container_list}>
          <button onClick={() => funLicstCLick("office")}>
            <span>{selectOffice?.name}</span>
            <img src={arrow} alt="arrow" />
          </button>
          <AnimatePresence>
            {listShow === "office" && (
              <motion.ul
                className={styles.list}
                initial={{ height: 0, overflow: "auto" }}
                animate={{ height: "auto", overflow: "hidden" }}
                exit={{ height: 0, overflow: "hidden" }}
              >
                {offices?.data?.map((item) => (
                  <li key={item.id} onClick={() => funSelectOffice(item.id)}>
                    {item.name}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        <div className={styles.container_list}>
          <button onClick={() => funLicstCLick("floor")}>
            <span>{selectFloor?.name}</span>
            <img src={arrow} alt="arrow" />
          </button>
          <AnimatePresence>
            {listShow === "floor" && (
              <motion.ul
                className={styles.list}
                initial={{ height: 0, overflow: "auto" }}
                animate={{ height: "auto", overflow: "hidden" }}
                exit={{ height: 0, overflow: "hidden" }}
              >
                {selectOffice?.floors &&
                  [...selectOffice?.floors]
                    ?.sort((a, b) => a.number - b.number)
                    ?.map((item) => (
                      <li key={item.id} onClick={() => funSelectFloor(item.id)}>
                        {item.name}
                      </li>
                    ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
      {!noedit && (
        <div className={styles.param}>
          <button className={styles.download} onClick={funDownload}>
            Скачать
          </button>
          <button onClick={funSave}>Сохранить</button>
        </div>
      )}
    </div>
  );
}

export default TopMenu;
