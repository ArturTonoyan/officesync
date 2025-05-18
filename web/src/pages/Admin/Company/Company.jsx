import { useEffect, useState } from "react";
import FileComponent from "../../../modules/FileComponent/FileComponent";
import styles from "./Company.module.scss";
import { inputs } from "./data";
import noPhoto from "@assets/images/icons/nophoto.png";
import {
  apiCreateCompany,
  apiGetCompany,
  apiUpdateCompany,
  server,
} from "../../../api/apirequests";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";

function Company({ funUpdUser, noedit }) {
  const [editing, setEditing] = useState(true);
  const user = useSelector((state) => state.user.user.data);

  useEffect(() => {
    if (!user?.companyId) {
      setEditing(false);
    } else {
      setEditing(true);
    }
  }, []);

  const [data, setData] = useState({
    name: "",
    phone: "",
    email: "",
    inn: "",
    image: null,
    imageUrl: null,
    adress: "",
  });

  const {
    status,
    data: query,
    error,
    refetch,
  } = useQuery({
    queryKey: ["companies", user?.companyId],
    queryFn: () => apiGetCompany(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  useEffect(() => {
    if (query?.data) {
      setData({
        ...query?.data,
        imageUrl: query?.data?.image ? `${server}/${query?.data?.image}` : null,
      });
    }
  }, [query?.data]);

  const funSetPhoto = (file) => {
    if (!file) return;
    setData({
      ...data,
      image: file,
      imageUrl: URL.createObjectURL(file),
    });
  };

  const funChanegeData = (name, value) => {
    setData({
      ...data,
      [name]: value,
    });
  };

  const funSave = () => {
    if (query?.data?.id) {
      //! обновление компании
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("phone", data.phone);
      formData.append("email", data.email);
      formData.append("inn", data.inn);
      formData.append("adress", data.adress);
      formData.append("image", data.image);
      apiUpdateCompany(formData, user?.companyId).then((res) => {
        if (res.status === 200) {
          setEditing(true);
          refetch();
        }
      });
    } else {
      //! создание компании
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("phone", data.phone);
      formData.append("email", data.email);
      formData.append("inn", data.inn);
      formData.append("image", data.image);
      formData.append("adress", data.adress);
      apiCreateCompany(formData).then((res) => {
        if (res.status === 201) {
          setEditing(true);
          refetch();
          funUpdUser();
        }
      });
    }
  };

  if (status === "loading") {
    return <span>Загрузка...</span>;
  }

  // if (status === "error") {
  //   return <span>Ошибка</span>;
  // }

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
                key={index}
              >
                <span className={styles.name}>{item.name}</span>
                <div className={styles.input}>
                  <input
                    key={index}
                    type={item.type}
                    autoComplete="new-password"
                    readOnly={editing}
                    placeholder="Не указанно"
                    onChange={(e) => funChanegeData(item.key, e.target.value)}
                    value={data[item.key]}
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
                  onChange={(e) => funChanegeData("adress", e.target.value)}
                  value={data.adress || ""}
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
        {!noedit && (
          <div className={styles.btn}>
            {editing ? (
              <button className={styles.save} onClick={() => setEditing(false)}>
                Редактировать
              </button>
            ) : (
              <>
                <button
                  className={styles.cancel}
                  onClick={() => setEditing(true)}
                >
                  Отменить
                </button>
                <button className={styles.save} onClick={funSave}>
                  {query?.data?.id ? (
                    <span>Сохранить</span>
                  ) : (
                    <span>Создать</span>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Company;
