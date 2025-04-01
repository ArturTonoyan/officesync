import { useRef, useState } from "react";
import styles from "./ConvasSpace.module.scss";
import { Stage, Layer } from "react-konva";
import Scale from "../../components/Scale/Scale";
import BottomMenu from "../../components/BottomMenu/BottomMenu";
import EditableIcon from "../../components/EditableIcon/EditableIcon";
import ModalAddObject from "../../components/ModalAddObject/ModalAddObject";
import RightMenu from "../RightMenu/RightMenu";
import TopMenu from "../TopMenu/TopMenu";
import { useDispatch, useSelector } from "react-redux";
import { setSelected } from "../../../../store/convaSlice/conva.Slice";
import LeftMenu from "../LeftMenu/LeftMenu";
function ConvasSpace() {
  const dispatch = useDispatch();
  const conva = useSelector((state) => state.conva);
  const [scale, setScale] = useState(1);
  const stageRef = useRef(null);
  const [modalAddEquipment, setModalAddEquipment] = useState(false);

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

  const handleStageClick = (e) => {
    if (e.target !== e.currentTarget) return;
    dispatch(setSelected(null));
  };

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
          {/* Objects */}
          {conva.objects.data &&
            [...conva.objects.data]
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((object) => (
                <EditableIcon key={object.id} object={object} />
              ))}
        </Layer>
      </Stage>

      {/* Bottom Menu */}
      <BottomMenu setModalAddEquipment={setModalAddEquipment} />
      <Scale scale={scale} setScale={setScale} />

      {/* Right Menu */}
      <RightMenu />

      {/* Left Menu */}
      <LeftMenu />

      {/* Top Menu */}
      <TopMenu />

      {/* Modals */}
      <ModalAddObject
        show={modalAddEquipment}
        setShow={setModalAddEquipment}
        title={"Добавить объект"}
      />
    </div>
  );
}

export default ConvasSpace;
