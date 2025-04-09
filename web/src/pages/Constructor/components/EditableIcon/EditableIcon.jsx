import React, { useRef, useEffect } from "react";
import { Image, Transformer } from "react-konva";
import { useDispatch, useSelector } from "react-redux";
import useImage from "use-image";
import {
  setDataManyParams,
  setSelected,
} from "../../../../store/convaSlice/conva.Slice";

const EditableIcon = ({ object }) => {
  const dispatch = useDispatch();
  const isSelected =
    useSelector((state) => state.conva.objects.selected) === object.id;
  const [image] = useImage(object.icon || object.image);
  const imageRef = useRef(null); // Use ref for the image
  const transformerRef = useRef(null); // Use ref for the transformer

  useEffect(() => {
    if (isSelected && transformerRef.current && !object.locked) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  //! изменение позиции обьекта
  const handleDragEnd = (e) => {
    dispatch(
      setDataManyParams({ values: { x: e.target.x(), y: e.target.y() } })
    );
  };

  //! выделение обьекта для изменения
  const handleSelect = (id) => {
    dispatch(setSelected(id));
  };

  //! трансформация обьекта
  const handleTransformEnd = (e) => {
    const newWidth = e.target.width() * e.target.scaleX();
    const newHeight = e.target.height() * e.target.scaleY();
    const values = {
      width: newWidth,
      height: newHeight,
      scaleX: e.target.scaleX(),
      scaleY: e.target.scaleY(),
      rotation: e.target.rotation(),
    };
    dispatch(setDataManyParams({ values }));
  };

  return (
    <>
      <Image
        image={image}
        draggable={!object.isLocked}
        scaleX={object.scaleX}
        scaleY={object.scaleY}
        rotation={object.rotation}
        x={object.x}
        y={object.y}
        width={object.width / object.scaleX}
        height={object.height / object.scaleY}
        onDragEnd={(e) =>
          !object.isLocked ? handleDragEnd(e, object.id) : null
        }
        onClick={() =>
          !object.isLocked ? handleSelect(object.id) : handleSelect(null)
        }
        onMouseDown={() => (!object.isLocked ? handleSelect(object.id) : null)}
        ref={imageRef}
      />
      {isSelected && !object.isLocked && (
        <Transformer
          ref={transformerRef}
          onTransformEnd={(e) => {
            handleTransformEnd(e, object.id);
          }}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default EditableIcon;
