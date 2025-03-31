import { useRef, useState } from "react";
import styles from "./ConvasSpace.module.scss";
import { Stage, Layer, Rect } from "react-konva";
import Grid from "../../components/Grid/Grid";
import Scale from "../../components/Scale/Scale";
import BottomMenu from "../../components/BottomMenu/BottomMenu";
import { objects } from "./data";
import EditableIcon from "../../components/EditableIcon/EditableIcon";
import ModalAddObject from "../../components/ModalAddObject/ModalAddObject";
import ModalAllIcons from "../../../../modules/ModalAllIcons/ModalAllIcons";
import RightMenu from "../RightMenu/RightMenu";
import TopMenu from "../TopMenu/TopMenu";

function ConvasSpace() {
  const [data, setData] = useState(objects);
  const [scale, setScale] = useState(1);
  const stageRef = useRef(null);
  const [modalAddEquipment, setModalAddEquipment] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

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
    if (newScale > 1.5) {
      newScale = 1.5;
    }
    setScale(newScale);

    stage.scale({ x: newScale, y: newScale });
    stage.position({
      x: pointer.x - (pointer.x - stage.x()) * (newScale / oldScale),
      y: pointer.y - (pointer.y - stage.y()) * (newScale / oldScale),
    });
  };

  //! при клике вне EditableIcon убираем выделение
  const handleStageClick = (e) => {
    if (e.target !== e.currentTarget) return;
    setIsSelected(false);
  };

  //! изменение позиции обьекта
  const handleDragEnd = (e, id) => {
    console.log("e", e);
    const newData = data.map((object) => {
      if (object.id === id) {
        const { x, y, scaleX, scaleY, rotation } = e.target.attrs;
        const { width, height } = e.currentTarget.attrs;
        return {
          ...object,
          x: e.target.x(),
          y: e.target.y(),
          scaleX: e.target?.attrs?.scaleX,
          scaleY: e.target.attrs?.scaleY,
          rotation: rotation,
          width: width,
          height: height,
        };
      }
      return object;
    });
    setData(newData);
  };

  //! выделение обьекта для изменения
  const handleSelect = (id) => {
    setIsSelected(id);
  };

  console.log("data", data);

  return (
    <div className={styles.ConvasSpace}>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        draggable
        onWheel={handleWheel}
        ref={stageRef}
        scaleX={scale}
        scaleY={scale}
        onClick={handleStageClick}
      >
        <Layer>
          {/* Сетка */}
          <Grid />

          {/* Объекты */}
          {data?.map((object) => (
            <EditableIcon
              isSelected={isSelected === object.id}
              object={object}
              handleDragEnd={handleDragEnd}
              handleSelect={handleSelect}
            />
          ))}
        </Layer>
      </Stage>

      {/* Нижнее меню */}
      <BottomMenu setModalAddEquipment={setModalAddEquipment} />
      <Scale scale={scale} setScale={setScale} />

      {/* правое меню */}
      <RightMenu
        item={data.find((item) => item.id === isSelected)}
        data={data}
        setData={setData}
      />

      {/* Верхнее меню */}
      <TopMenu />

      {/* Попапы */}
      <ModalAddObject
        show={modalAddEquipment}
        setShow={setModalAddEquipment}
        title={"Добавить объект"}
        objects={data}
        setObjects={setData}
      />
    </div>
  );
}

export default ConvasSpace;
