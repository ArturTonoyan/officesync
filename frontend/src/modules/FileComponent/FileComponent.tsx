import { useEffect, useState } from "react";
import trashIcon from "@assets/images/icons/trashBeliy.svg";
import fileIcon from "@assets/images/AdminPanel/file.svg";
import pdfIcon from "@assets/images/AdminPanel/pdf.svg";
import pdfIconImport from "@assets/images/AdminPanel/pdfImport.svg";
import docIcon from "@assets/images/AdminPanel/doc.svg";
import dragingIcon from "@assets/images/AdminPanel/dragging.svg";
import { decodeFileName } from "../../utils/functions/funcions";
import { cn } from "@utils/cn";

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
      const response = await fetch(filePath);
      const blob = await response.blob();

      const file = new File([blob], filePath.split("/").pop(), {
        type: blob.type,
      });

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

  const funFileHeaderClick = () => {
    document.getElementById(props.name).click();
  };

  const funChangeLogoHeader = (file) => {
    if (props.fileSize) {
      const maxSizeInBytes = props.fileSize * 1024 * 1024;
      if (file && file.size > maxSizeInBytes) {
        setErrorSize(true);
        return;
      }
    }

    if (file && !props.typeFile?.find((el) => el === file.type)) {
      alert(`Пожалуйста, выберите только ${props.typeFile}-файл.`);
      setLogoHeader(null);
      props.setData(null, props.itemKey);
    } else if (file) {
      const fileUrl = URL.createObjectURL(file);
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

  const handleImageLoad = (event) => {
    const img = event.target;
    if (img.naturalHeight > img.naturalWidth) {
      setImageStyleHeader({ height: "100%", width: "auto" });
    } else {
      setImageStyleHeader({ width: "100%", height: "auto" });
    }
  };

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

  const handleDrop = (event) => {
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

  const logoFadeClass = cn(
    "scale-95 opacity-0 transition-[opacity,transform] duration-500",
    isVisibleHeader === true && "scale-100 opacity-100",
    isVisibleHeader === null && "opacity-0 transition-none",
  );

  const innerFadeClass = cn(
    "flex h-full w-full scale-[0.97] flex-col items-center justify-center gap-2.5 p-4 opacity-0 transition-[opacity,transform] duration-[350ms]",
    isVisibleNoFileHeader === true && "scale-100 opacity-100",
    isVisibleNoFileHeader === null && "opacity-0 transition-none",
  );

  const dragOverlayClass = cn(
    "absolute inset-0 z-[400] flex h-full w-full items-center justify-center bg-[rgba(17,17,17,0.04)] opacity-0 transition-opacity duration-150",
    isDragging === true && "opacity-100",
    isDragging === null && "opacity-0",
  );

  const dragContentClass = cn(
    "transition-opacity duration-150",
    isDragging !== null ? "opacity-0" : "opacity-100",
  );

  return (
    <div
      className="relative flex h-full w-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {logoHeader ? (
        <div className="relative flex h-full w-full items-center justify-center rounded-sm border-0 bg-transparent">
          {props.icon === "png" && (
            <div className="flex h-1/2 w-1/2 items-center justify-center">
              <img
                src={logoHeader}
                onClick={funOpenFile}
                alt="Фото загруженно"
                className={cn("max-h-full max-w-full object-contain", logoFadeClass)}
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
            <div className="flex h-full w-full items-center justify-center overflow-hidden">
              <div
                className={cn(
                  "flex h-full w-full flex-col items-center justify-center",
                  logoFadeClass,
                )}
              >
                <img
                  onClick={funOpenFile}
                  src={props.icon === "doc" ? docIcon : pdfIconImport}
                  alt="Файл загружен"
                  className="h-[62px] w-[57px] cursor-pointer max-[769px]:h-[43px] max-[769px]:w-[47px]"
                />
                <span
                  name="file_name"
                  onClick={funOpenFile}
                  className="mt-2 max-w-[80%] cursor-pointer p-0 text-center text-[13px] font-medium leading-snug tracking-[-0.01em] text-fg-secondary"
                >
                  {props.fileName ||
                    props.data?.name ||
                    decodeFileName(fileName)}
                </span>
              </div>
            </div>
          )}
          {!props.readOnly && (
            <button
              className="absolute right-3 top-3 box-border cursor-pointer rounded-sm bg-[rgba(17,17,17,0.72)] p-1.5 transition-opacity hover:opacity-60 active:opacity-100 max-[480px]:right-2 max-[480px]:top-2"
              onClick={() => funDeleteFile()}
            >
              <img
                src={trashIcon}
                alt="Удалить файл"
                className={cn("h-4 w-4 max-[480px]:h-3.5 max-[480px]:w-3.5", logoFadeClass)}
              />
            </button>
          )}
        </div>
      ) : (
        <div
          className="relative flex h-full w-full cursor-pointer items-center justify-center rounded-sm transition-opacity hover:opacity-60 active:opacity-100"
          tabIndex="0"
          onClick={() => (props.readOnly ? null : funFileHeaderClick())}
        >
          <div className={innerFadeClass}>
            <div className={dragOverlayClass}>
              <img src={dragingIcon} alt="Перетащите в эту область" />
            </div>
            {props.icon === "png" && (
              <img
                className={cn("h-10 w-10 opacity-45 max-[769px]:h-9 max-[769px]:w-9", dragContentClass)}
                src={fileIcon}
                alt="Загрузить файл"
              />
            )}
            {props.icon === "pdf" && (
              <img
                className={cn("h-10 w-10 opacity-45 max-[769px]:h-9 max-[769px]:w-9", dragContentClass)}
                src={pdfIcon}
                alt="Загрузить файл"
              />
            )}
            {props.icon === "doc" && (
              <img
                className={cn("h-10 w-10 opacity-45 max-[769px]:h-9 max-[769px]:w-9", dragContentClass)}
                src={docIcon}
                alt="Загрузить файл"
              />
            )}
            {!errorSize ? (
              <span
                className={cn(
                  "m-0 max-w-[220px] text-balance p-0 text-center text-[13px] font-medium leading-snug tracking-[-0.01em] text-fg-muted",
                  dragContentClass,
                )}
                dangerouslySetInnerHTML={{ __html: props.text }}
              />
            ) : (
              <span className="text-tag-red">
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