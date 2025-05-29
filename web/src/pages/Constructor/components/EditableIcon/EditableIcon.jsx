import React, { useRef, useEffect, useState } from "react";
import { Image, Label, Tag, Text, Transformer } from "react-konva";
import { useDispatch, useSelector } from "react-redux";
import useImage from "use-image";
import {
  setDataManyParams,
  setSelected,
} from "../../../../store/convaSlice/conva.Slice";
import { typesNoEquipment } from "../ModalAddObject/data";

const EditableIcon = ({ saveAction, object, noedit, setSelectedRoom }) => {
  const [showListInfo, setShowListInfo] = useState(false);
  const GRID_SIZE = 10;
  const ROTATE_STEP = 5; // шаг поворота в градусах

  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setShowListInfo(saveAction);
  }, [saveAction]);

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
    const node = e.target;
    const snappedX = Math.round(node.x() / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(node.y() / GRID_SIZE) * GRID_SIZE;

    // Устанавливаем привязанные координаты
    node.position({ x: snappedX, y: snappedY });

    // Обновляем Redux
    dispatch(
      setDataManyParams({
        values: { x: snappedX, y: snappedY },
        id: object.id,
      })
    );
  };

  //! выделение обьекта для изменения
  const handleSelect = (id) => {
    dispatch(setSelected(id));
  };

  //! трансформация обьекта
  const handleTransformEnd = (e) => {
    const node = e.target;

    const rawWidth = node.width() * node.scaleX();
    const rawHeight = node.height() * node.scaleY();

    const snappedWidth = Math.max(
      GRID_SIZE,
      Math.round(rawWidth / GRID_SIZE) * GRID_SIZE
    );
    const snappedHeight = Math.max(
      GRID_SIZE,
      Math.round(rawHeight / GRID_SIZE) * GRID_SIZE
    );

    const rawRotation = node.rotation();
    const snappedRotation = Math.round(rawRotation / ROTATE_STEP) * ROTATE_STEP;

    // Обновляем DOM
    node.width(snappedWidth);
    node.height(snappedHeight);
    node.scaleX(1);
    node.scaleY(1);
    node.rotation(snappedRotation);

    dispatch(
      setDataManyParams({
        id: object.id,
        values: {
          width: snappedWidth,
          height: snappedHeight,
          scaleX: 1,
          scaleY: 1,
          rotation: snappedRotation,
        },
      })
    );
  };

  const infoText = object.equipment
    ? `Название: ${object.equipment.name}
Описание: ${object.equipment.description}
Инв. номер: ${object.equipment.inventoryNumber}
Стоимость: ${object.equipment.cost}₽
Наработка: ${object.equipment.currentWarranty}/${object.equipment.maxWarranty}
Дата: ${new Date(object.equipment.createdAt).toLocaleDateString()}`
    : null;

  return (
    <>
      {showListInfo && infoText && (
        <Label x={object.x + 50} y={object.y - 10}>
          <Tag
            fill="white"
            stroke="black"
            cornerRadius={4}
            shadowColor="black"
            shadowBlur={5}
            shadowOffset={{ x: 2, y: 2 }}
            shadowOpacity={0.2}
          />
          <Text
            text={infoText}
            fontSize={12}
            padding={5}
            fill="black"
            width={200}
          />
        </Label>
      )}
      <Image
        image={image}
        draggable={!object.isLocked && !noedit}
        scaleX={object.scaleX}
        scaleY={object.scaleY}
        rotation={object.rotation}
        x={object.x}
        y={object.y}
        width={object.width / object.scaleX}
        height={object.height / object.scaleY}
        onDragEnd={(e) =>
          !noedit && !object.isLocked ? handleDragEnd(e, object.id) : null
        }
        onClick={() => {
          if (noedit) {
            typesNoEquipment.includes(object.type) && setSelectedRoom(object);
          } else {
            !object.isLocked ? handleSelect(object.id) : handleSelect(null);
          }
        }}
        onMouseDown={() =>
          !noedit && !object.isLocked ? handleSelect(object.id) : null
        }
        ref={imageRef}
        onMouseEnter={() => {
          setShowListInfo(true);
          if (noedit) {
            typesNoEquipment.includes(object.type) && setIsHovered(true);
          } else {
            setIsHovered(true);
          }
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowListInfo(false);
        }}
        shadowColor={isHovered ? "blue" : ""}
        shadowBlur={isHovered ? 5 : 0}
        shadowOpacity={isHovered ? 0.6 : 0}
      />
      {isSelected && !object.isLocked && !noedit && (
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
