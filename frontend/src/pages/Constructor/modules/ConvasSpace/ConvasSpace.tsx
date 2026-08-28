import { useEffect, useRef, useState } from "react";
import styles from "./ConvasSpace.module.scss";
import { Stage, Layer } from "react-konva";
import Scale from "../../components/Scale/Scale";
import BottomMenu from "../../components/BottomMenu/BottomMenu";
import EditableIcon from "../../components/EditableIcon/EditableIcon";
import ModalAddObject from "../../components/ModalAddObject/ModalAddObject";
import RightMenu from "../RightMenu/RightMenu";
import TopMenu from "../TopMenu/TopMenu";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@store/hooks";
import {
  setObjects,
  setSelected,
} from "../../../../store/convaSlice/conva.Slice";
import LeftMenu from "../LeftMenu/LeftMenu";
import { useQuery } from "@tanstack/react-query";
import {
  apiEddElements,
  apiGetElements,
  apiGetFloors,
  apiGetOffices,
  apiUpdateFloorImage,
} from "../../../../api/apirequests";

function ConvasSpace({ noedit, setSelectedRoom }) {
  const dispatch = useDispatch();
  const user = useAppSelector((state) => state.user.user.data);
  const conva = useAppSelector((state) => state.conva);
  const [scale, setScale] = useState(1);
  const stageRef = useRef(null);
  const [modalAddEquipment, setModalAddEquipment] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saveAction, setSaveAction] = useState(false);

  const { data: offices, refetch: refetchOffices } = useQuery({
    queryKey: ["offices/all/id", user?.companyId],
    queryFn: () => apiGetOffices(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  const { data: floors, refetch: refetchFloors } = useQuery({
    queryKey: ["offices", user?.companyId],
    queryFn: () => apiGetFloors(user?.companyId),
    staleTime: Infinity, //! не обновлять
    enabled: !!user?.companyId,
  });

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    if (newScale < 0.1) {
      newScale = 0.1;
    }
    if (newScale > 2) {
      newScale = 2;
    }
    setScale(newScale);

    stage.scale({ x: newScale, y: newScale });
    stage.position({
      x: pointer.x - (pointer.x - stage.x()) * (newScale / oldScale),
      y: pointer.y - (pointer.y - stage.y()) * (newScale / oldScale),
    });
  };

  const handleStageClick = (e) => {
    if (e.target !== e.currentTarget) return;
    dispatch(setSelected(null));
  };

  //! функция обновления элементов
  const funGetElem = () => {
    if (conva?.floors?.selected) {
      apiGetElements(conva?.floors?.selected).then((res) => {
        console.log("res", res);
        if (res.status === 200) dispatch(setObjects({ data: res.data }));
      });
    }
  };
  useEffect(() => {
    funGetElem();
  }, [conva?.floors?.selected]);

  //! сохранение фотки в виде пнг
  const handleDownload = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement("a");
    link.download = "my-canvas.png";
    link.href = uri;
    link.click();
  };

  //! сохранить карту
  const funSave = async () => {
    setSaveAction(true);
    const qerydata = conva?.objects?.data?.map((obj) => ({
      ...obj,
      floorId: conva?.floors?.selected,
    }));
    apiEddElements(qerydata);
  };

  useEffect(() => {
    if (saveAction) {
      const saveImage = async () => {
        const uri = stageRef.current.toDataURL({
          mimeType: "image/png",
          pixelRatio: 2, // можно увеличить качество
        });

        const blob = await fetch(uri).then((res) => res.blob());

        const formData = new FormData();
        formData.append("image", blob, "canvas.png");

        await apiUpdateFloorImage(formData, conva?.floors?.selected).then(
          () => {
            setSaveAction(false);
          }
        );
      };

      saveImage();
    }
  }, [saveAction]);

  return (
    <div className={styles.ConvasSpace}>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        draggable
        onWheel={!noedit && handleWheel}
        ref={stageRef}
        scaleX={scale}
        scaleY={scale}
        onClick={!noedit && handleStageClick}
      >
        <Layer>
          {/* Objects */}
          {conva.objects.data &&
            [...conva.objects.data]
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((object, index) => (
                <EditableIcon
                  saveAction={saveAction}
                  key={index}
                  object={object}
                  noedit={noedit}
                  setSelectedRoom={setSelectedRoom}
                />
              ))}
        </Layer>
      </Stage>

      {/* Bottom Menu */}
      {!noedit && <BottomMenu setModalAddEquipment={setModalAddEquipment} />}
      <Scale scale={scale} setScale={setScale} />

      {/* Right Menu */}
      {!noedit && (
        <RightMenu
          setModalAddEquipment={setModalAddEquipment}
          setEditItem={setEditData}
        />
      )}

      {/* Left Menu */}
      {!noedit && <LeftMenu />}

      {/* Top Menu */}
      <TopMenu
        floors={floors}
        offices={offices}
        funSave={funSave}
        funDownload={handleDownload}
        noedit={noedit}
      />

      {/* Modals */}
      <ModalAddObject
        funGetElem={funGetElem}
        editData={editData}
        setEditData={setEditData}
        show={modalAddEquipment}
        setShow={setModalAddEquipment}
        title={editData?.id ? "Редактировать объект" : "Добавить объект"}
      />
    </div>
  );
}

export default ConvasSpace;
