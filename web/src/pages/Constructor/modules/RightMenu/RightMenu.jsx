import { useState } from "react";
import styles from "./RightMenu.module.scss";
import arrow from "@assets/images/icons/arrow.svg";
import { inputs } from "./data";
import { useDispatch, useSelector } from "react-redux";
import {
  setDataBySelected,
  deleteObject,
} from "../../../../store/convaSlice/conva.Slice";
function RightMenu() {
  const dispatch = useDispatch();
  const item = useSelector((state) => state.conva.objects.selectedObject);
  const [openMenu, setOpenMenu] = useState(true);
  const [editData, setEditData] = useState(null);
  const [value, setValue] = useState("");

  const funChangeData = (key, value) => {
    dispatch(setDataBySelected({ key, value }));
  };

  const funDelete = () => {
    dispatch(deleteObject(item.id));
  };

  return (
    <div
      className={`${styles.RightMenu} ${
        !openMenu ? styles.RightMenuClose : ""
      }`}
    >
      <div className={styles.head}>
        <img
          src={arrow}
          alt="arrow"
          onClick={() => setOpenMenu(!openMenu)}
          className={!openMenu ? styles.rotate : ""}
        />
        <h3>Параметры объекта</h3>
      </div>
      {item?.id && (
        <>
          <h4>Позиция</h4>
          <div className={styles.position}>
            {inputs.map((el, index) => (
              <div className={styles.input_box} name={el.key}>
                <span className={styles.name}>{el.name}</span>
                <div className={styles.input}>
                  <input
                    key={index}
                    type={el.type}
                    autoComplete="new-password"
                    value={
                      editData === index
                        ? value
                        : Number(item?.[el.key])?.toFixed(2)
                    }
                    onFocus={() => {
                      setEditData(index);
                      setValue(item?.[el.key]);
                    }}
                    onBlur={() => {
                      setEditData(null);
                      funChangeData(el.key, value);
                    }}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {item?.id && (
        <div className={styles.actions}>
          <h4>Действия</h4>
          <div className={styles.actions_container}>
            <button onClick={funDelete}>Удалить</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RightMenu;
