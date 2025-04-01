import { useState } from "react";
import FileComponent from "../../../modules/FileComponent/FileComponent";
import styles from "./Company.module.scss";
import { inputs } from "./data";
import noPhoto from "@assets/images/icons/nophoto.png";

function Company() {
  const [editing, setEditing] = useState(true);

  const [data, setData] = useState({
    name: "",
    phone: "",
    email: "",
    inn: "",
    image: null,
    imageUrl: null,
  });

  const funSetPhoto = (file) => {
    if (!file) return;
    setData({
      ...data,
      image: file,
      imageUrl: URL.createObjectURL(file),
    });
  };

  return (
    <div className={styles.Company}>
      <h1>Компания</h1>
      <div className={styles.content}>
        <div className={styles.form}>
          <div className={styles.first}>
            {inputs.map((item, index) => (
              <div
                className={`${styles.input_box} ${editing ? styles.edit : ""}`}
                name={item.key}
              >
                <span className={styles.name}>{item.name}</span>
                <div className={styles.input}>
                  <input
                    key={index}
                    type={item.type}
                    autoComplete="new-password"
                    readOnly={editing}
                    placeholder="Не указанно"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className={styles.second}>
            <div
              className={`${styles.input_box} ${editing ? styles.edit : ""}`}
              name={"adress"}
            >
              <span className={styles.name}>Юридический адрес</span>
              <div className={styles.input}>
                <input
                  type="text"
                  autoComplete="new-password"
                  readOnly={editing}
                  placeholder="Не указанно"
                />
              </div>
            </div>
            <span className={styles.name}>Логотип</span>
            <div className={`${styles.file} ${editing ? styles.editFile : ""}`}>
              <FileComponent
                logoHeader={data.imageUrl || noPhoto}
                fileSize={50}
                data={data?.image}
                setData={funSetPhoto}
                typeFile={["image/png"]}
                accept={".png"}
                name={"image"}
                icon={"png"}
                text={"Загрузите или перетащите<br/>фотографию в формате PNG"}
                readOnly={editing}
              />
            </div>
          </div>
        </div>

        <div className={styles.btn}>
          {editing ? (
            <button className={styles.save} onClick={() => setEditing(false)}>
              Редактировать
            </button>
          ) : (
            <button className={styles.save} onClick={() => setEditing(true)}>
              Сохранить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Company;
