import { useRef, useState } from "react";
import styles from "./ConvasSpace.module.scss";
import { Stage, Layer, Rect } from "react-konva";
import Grid from "../../components/Grid/Grid";
import Scale from "../../components/Scale/Scale";

function ConvasSpace() {
  const [scale, setScale] = useState(1);
  const stageRef = useRef(null);

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
    if (newScale > 1) {
      newScale = 1;
    }
    setScale(newScale);

    stage.scale({ x: newScale, y: newScale });
    stage.position({
      x: pointer.x - (pointer.x - stage.x()) * (newScale / oldScale),
      y: pointer.y - (pointer.y - stage.y()) * (newScale / oldScale),
    });
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
      >
        <Layer>
          {/* Сетка */}
          <Grid />

          {/* Комната */}
          <Rect
            x={100}
            y={100}
            width={200}
            height={150}
            fill="blue"
            draggable
          />
        </Layer>
      </Stage>
      <Scale scale={scale} setScale={setScale} />
    </div>
  );
}

export default ConvasSpace;
