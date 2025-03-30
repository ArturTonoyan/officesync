import styles from "./FileComponent.module.scss";
import { useEffect, useState } from "react";
import trashIcon from "@assets/images/icons/trashBeliy.svg";
import fileIcon from "@assets/images/AdminPanel/file.svg";
import pdfIcon from "@assets/images/AdminPanel/pdf.svg";
import pdfIconImport from "@assets/images/AdminPanel/pdfImport.svg";
import docIcon from "@assets/images/AdminPanel/doc.svg";
import dragingIcon from "@assets/images/AdminPanel/dragging.svg";
import { decodeFileName } from "../../utils/functions/funcions";
// import { server } from "../../../apirequests/apirequests";
// import { decodeFileName } from "../../../utils/functions/funcions";
const server = "http://localhost:3000";

function FileComponent(props) {
  const [logoHeader, setLogoHeader] = useState(null);
  const [imageStyleHeader, setImageStyleHeader] = useState({});
  const [isVisibleHeader, setIsVisibleHeader] = useState(null);
  const [isVisibleNoFileHeader, setIsVisibleNoFileHeader] = useState(true);
  const [isDragging, setIsDragging] = useState(null);
  const [errorSize, setErrorSize] = useState(false);
  const [fileName, setFileName] = useState(null);

  async function setFileFromPath(filePath, inputElement) {
    try {
      // Загружаем файл
      const response = await fetch(filePath);
      const blob = await response.blob();

      // Создаем объект File
      const file = new File([blob], filePath.split("/").pop(), {
        type: blob.type,
      });

      // Используем DataTransfer API для вставки в input
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      inputElement.files = dataTransfer.files;
    } catch (error) {
      console.error("Ошибка при загрузке файла:", error);
    }
  }

  useEffect(() => {
    if (typeof props.logoHeader === "string") {
      setLogoHeader(props.logoHeader);
      setIsVisibleHeader(true);
      const inputElement = document.querySelector("#" + props.name);
      setFileFromPath(props.logoHeader, inputElement);
      setFileName(props.logoHeader.split("\\").pop());
    }
  }, [props.logoHeader]);
  //! при клике на загрузить логотип хедера открываем инпут для загрузки файла
  const funFileHeaderClick = () => {
    document.getElementById(props.name).click();
  };

  //! функция изменения хедер иконки
  const funChangeLogoHeader = (file) => {
    //! проверка на размер файла
    if (props.fileSize) {
      const maxSizeInBytes = props.fileSize * 1024 * 1024; // 20 MB in bytes
      if (file && file.size > maxSizeInBytes) {
        setErrorSize(true);
        return;
      }
    }

    // const file = event.target.files[0];
    if (file && !props.typeFile?.find((el) => el === file.type)) {
      alert(`Пожалуйста, выберите только ${props.typeFile}-файл.`);
      //   event.target.value = ""; // Сбрасываем выбранный файл
      setLogoHeader(null);
      props.setData(null, props.itemKey);
    } else if (file) {
      const fileUrl = URL.createObjectURL(file); // Создаем временный URL для файла
      setIsVisibleNoFileHeader(false);
      setTimeout(() => {
        setLogoHeader(fileUrl);
        setTimeout(() => {
          setIsVisibleHeader(true);
        }, 300);
        setErrorSize(false);
      }, 500);
      props.setData(file, props.itemKey);
    }
  };

  //! определяем соотношение фото
  const handleImageLoad = (event) => {
    const img = event.target;
    if (img.naturalHeight > img.naturalWidth) {
      // Вертикальное изображение
      setImageStyleHeader({ height: "100%", width: "auto" });
    } else {
      // Горизонтальное изображение
      setImageStyleHeader({ width: "100%", height: "auto" });
    }
  };

  //! удалаение файла
  const funDeleteFile = () => {
    setIsVisibleHeader(false);
    setTimeout(() => {
      setLogoHeader(null);
      setIsVisibleHeader(null);
      props.setData(null, props.itemKey);
      if (document.getElementById(props.name)) {
        document.getElementById(props.name).value = "";
      }
      setIsVisibleNoFileHeader(null);
      setTimeout(() => {
        setIsVisibleNoFileHeader(true);
      }, 300);
    }, 500);
  };

  //! обработка загрузки через drag-and-drop
  const handleDrop = (event) => {
    // если файла нет то тогда можно загрузить
    if (logoHeader) return;
    event.preventDefault();
    setIsDragging(false);
    setTimeout(() => {
      setIsDragging(null);
    }, 300);
    const file = event.dataTransfer.files[0];
    funChangeLogoHeader(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    // Check if the drag is leaving the entire container
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsDragging(false);
      setTimeout(() => {
        setIsDragging(null);
      }, 300);
    }
  };

  const funOpenFile = () => {
    if (typeof props.logoHeader === "string") {
      window.open(`${server}/${props.logoHeader}`, "_blank");
    }
  };

  return (
    <div
      className={styles.FileComponent}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {logoHeader ? (
        <div className={styles.container_file}>
          {props.icon === "png" && (
            <div className={styles.container_file_inner}>
              <img
                src={logoHeader}
                onClick={funOpenFile}
                alt="Фото загруженно"
                className={`${styles.logo} ${
                  isVisibleHeader
                    ? styles.visible
                    : isVisibleHeader === null
                    ? styles.novisible
                    : ""
                }`}
                onError={() => {
                  setLogoHeader(null);
                  setIsVisibleHeader(null);
                }}
                onLoad={(e) => handleImageLoad(e)}
                style={imageStyleHeader}
              />
            </div>
          )}
          {(props.icon === "pdf" || props.icon === "doc") && (
            <div className={styles.container_file_inner_file}>
              <div
                className={`${styles.box_logo} ${
                  isVisibleHeader
                    ? styles.visible
                    : isVisibleHeader === null
                    ? styles.novisible
                    : ""
                }`}
              >
                <img
                  onClick={funOpenFile}
                  src={props.icon === "doc" ? docIcon : pdfIconImport}
                  alt="Файл загружен"
                />
                <span name="file_name" onClick={funOpenFile}>
                  {props.fileName ||
                    props.data?.name ||
                    decodeFileName(fileName)}
                </span>
              </div>
            </div>
          )}
          {!props.readOnly && (
            <button className={styles.delete} onClick={() => funDeleteFile()}>
              <img
                src={trashIcon}
                alt="Удалить файл"
                className={`${styles.logo} ${
                  isVisibleHeader
                    ? styles.visible
                    : isVisibleHeader === null
                    ? styles.novisible
                    : ""
                }`}
              />
            </button>
          )}
        </div>
      ) : (
        <div
          className={styles.container}
          tabIndex="0"
          onClick={() => (props.readOnly ? null : funFileHeaderClick())}
        >
          <div
            className={`${styles.container_inner} ${
              isVisibleNoFileHeader
                ? styles.visible
                : isVisibleNoFileHeader === null
                ? styles.novisible
                : ""
            }`}
          >
            <div
              className={`${styles.is_dragging} ${
                isDragging
                  ? styles.is_dragging_opasity
                  : isDragging === null
                  ? styles.is_dragging_opasity_no
                  : ""
              }`}
            >
              <img src={dragingIcon} alt="Перетащите в эту область" />
            </div>
            {props.icon === "png" && (
              <img
                className={
                  isDragging !== null
                    ? styles.is_dragging_opasity_no
                    : styles.is_dragging_opasity
                }
                src={fileIcon}
                alt="Загрузить файл"
              />
            )}
            {props.icon === "pdf" && (
              <img
                className={
                  isDragging !== null
                    ? styles.is_dragging_opasity_no
                    : styles.is_dragging_opasity
                }
                src={pdfIcon}
                alt="Загрузить файл"
              />
            )}
            {props.icon === "doc" && (
              <img
                className={
                  isDragging !== null
                    ? styles.is_dragging_opasity_no
                    : styles.is_dragging_opasity
                }
                src={docIcon}
                alt="Загрузить файл"
              />
            )}
            {!errorSize ? (
              <span
                className={
                  isDragging !== null
                    ? styles.is_dragging_opasity_no
                    : styles.is_dragging_opasity
                }
                dangerouslySetInnerHTML={{ __html: props.text }}
              ></span>
            ) : (
              <span className={styles.error_size}>
                Размер файла превышает
                <br />
                допустимый предел в {props.fileSize} Мб*
              </span>
            )}
          </div>
        </div>
      )}

      <input
        type="file"
        accept={props.accept}
        id={props.name}
        style={{ display: "none" }}
        onChange={(event) =>
          props.readOnly ? null : funChangeLogoHeader(event.target.files[0])
        }
        readOnly={props.readOnly}
      />
    </div>
  );
}

export default FileComponent;
