import { useEffect, useState } from "react";
import styles from "./LeftMenu.module.scss";
import arrow from "@assets/images/icons/arrow.svg";
import { useDispatch, useSelector } from "react-redux";
import {
  setDataParam,
  setSelected,
} from "../../../../store/convaSlice/conva.Slice";
import lupa from "@assets/images/icons/lupa.svg";
import zamokFalse from "@assets/images/icons/zamokFalse.svg";
import zamokTrue from "@assets/images/icons/zamokTrue.svg";
import { funAllSearch } from "../../../../utils/functions/funcions";

function LeftMenu() {
  const dispatch = useDispatch();
  const [openMenu, setOpenMenu] = useState(true);
  const objects = useSelector((state) => state.conva.objects.data);
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");

  const funClickObject = (id) => {
    dispatch(setSelected(id));
  };

  useEffect(() => {
    setData(funAllSearch(search, objects));
  }, [search, objects]);

  const funLocked = (id) => {
    dispatch(
      setDataParam({
        key: "isLocked",
        value: !objects.find((item) => item.id === id).isLocked,
        id,
      })
    );
  };

  return (
    <div
      className={`${styles.LeftMenu} ${!openMenu ? styles.LeftMenuClose : ""}`}
    >
      <div className={styles.search}>
        <input
          type="text"
          placeholder="Поиск"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <img src={lupa} alt="🔍" />
      </div>
      <div className={styles.head}>
        <h3>Объекты</h3>
        <img
          src={arrow}
          alt="arrow"
          onClick={() => setOpenMenu(!openMenu)}
          className={!openMenu ? styles.rotate : ""}
        />
      </div>
      <div className={styles.objects}>
        {data.map((item, index) => (
          <div
            key={index}
            className={styles.object}
            onClick={() => funClickObject(item.id)}
          >
            <span>{item.name}</span>
            <img
              onClick={() => funLocked(item.id)}
              src={!item.isLocked ? zamokTrue : zamokFalse}
              alt="zamokFalse"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LeftMenu;
