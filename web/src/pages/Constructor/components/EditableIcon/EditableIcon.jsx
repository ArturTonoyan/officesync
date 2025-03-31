import React, { useState, useRef, useEffect } from "react";
import { Image, Transformer } from "react-konva";
import useImage from "use-image";

const EditableIcon = ({ isSelected, object, handleDragEnd, handleSelect }) => {
  const [image] = useImage(object.icon);
  const imageRef = useRef(null); // Use ref for the image
  const transformerRef = useRef(null); // Use ref for the transformer

  useEffect(() => {
    if (isSelected) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Image
        image={image}
        draggable
        scaleX={object.scaleX}
        scaleY={object.scaleY}
        rotation={object.rotation}
        x={object.x}
        y={object.y}
        onDragEnd={(e) => handleDragEnd(e, object.id)}
        onClick={() => handleSelect(object.id)}
        ref={imageRef} // Set the image reference
      />
      {isSelected && (
        <Transformer
          ref={transformerRef} // Set the transformer reference
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox; // Prevent shrinking below 5 pixels
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default EditableIcon;
