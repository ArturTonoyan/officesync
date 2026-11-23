import { useRef, useEffect, useState } from "react";
import {
  Image,
  Label,
  Tag,
  Text,
  Transformer,
  Rect,
} from "react-konva";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@store/hooks";
import useImage from "use-image";
import {
  setDataManyParams,
  setSelected,
} from "../../../../store/convaSlice/conva.Slice";
import { typesNoEquipment } from "../ModalAddObject/data";
import { OBJECT_COLORS, SHAPE_TYPES } from "../../utils/mapIcons";

const EditableIcon = ({
  saveAction,
  object,
  noedit,
  setSelectedRoom,
  activeTool,
  onDeleteRequest,
}) => {
  const [showListInfo, setShowListInfo] = useState(false);
  const GRID_SIZE = 10;
  const ROTATE_STEP = 5;
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setShowListInfo(saveAction);
  }, [saveAction]);

  const dispatch = useDispatch();
  const isSelected =
    useAppSelector((state) => state.conva.objects.selected) === object.id;
  const [image] = useImage(object.icon || object.image, "anonymous");
  const shapeRef = useRef(null);
  const transformerRef = useRef(null);

  const isShape = SHAPE_TYPES.includes(object.type);
  const colors = OBJECT_COLORS[object.type] || {
    fill: "#E2E8F0",
    stroke: "#64748B",
  };

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current && !object.isLocked) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, object.isLocked, object.type, object.width, object.height]);

  const handleDragEnd = (e) => {
    const node = e.target;
    const snappedX = Math.round(node.x() / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(node.y() / GRID_SIZE) * GRID_SIZE;
    node.position({ x: snappedX, y: snappedY });
    dispatch(
      setDataManyParams({
        values: { x: snappedX, y: snappedY },
        id: object.id,
      }),
    );
  };

  const handleSelect = (id) => {
    if (activeTool === "delete" && onDeleteRequest) {
      onDeleteRequest(id);
      return;
    }
    dispatch(setSelected(id));
  };

  const handleTransformEnd = (e) => {
    const node = e.target;
    const rawWidth = node.width() * node.scaleX();
    const rawHeight = node.height() * node.scaleY();
    const snappedWidth = Math.max(
      GRID_SIZE,
      Math.round(rawWidth / GRID_SIZE) * GRID_SIZE,
    );
    const snappedHeight = Math.max(
      GRID_SIZE,
      Math.round(rawHeight / GRID_SIZE) * GRID_SIZE,
    );
    const snappedRotation =
      Math.round(node.rotation() / ROTATE_STEP) * ROTATE_STEP;

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
      }),
    );
  };

  const infoText = object.equipment
    ? `Название: ${object.equipment.name}
Описание: ${object.equipment.description}
Инв. номер: ${object.equipment.inventoryNumber}
Стоимость: ${object.equipment.cost}₽
Наработка: ${object.equipment.currentWarranty}/${object.equipment.maxWarranty}
Дата: ${new Date(object.equipment.createdAt).toLocaleDateString()}`
    : object.name || null;

  const commonProps = {
    ref: shapeRef,
    draggable: !object.isLocked && !noedit && activeTool !== "delete",
    rotation: object.rotation || 0,
    x: object.x,
    y: object.y,
    onDragEnd: (e) =>
      !noedit && !object.isLocked ? handleDragEnd(e) : null,
    onClick: () => {
      if (noedit) {
        typesNoEquipment.includes(object.type) && setSelectedRoom?.(object);
      } else {
        !object.isLocked ? handleSelect(object.id) : handleSelect(null);
      }
    },
    onMouseDown: () =>
      !noedit && !object.isLocked ? handleSelect(object.id) : null,
    onMouseEnter: () => {
      setShowListInfo(true);
      if (noedit) {
        typesNoEquipment.includes(object.type) && setIsHovered(true);
      } else {
        setIsHovered(true);
      }
      document.body.style.cursor =
        activeTool === "delete" ? "not-allowed" : "pointer";
    },
    onMouseLeave: () => {
      setIsHovered(false);
      setShowListInfo(false);
      document.body.style.cursor = "default";
    },
    shadowColor: isHovered ? (activeTool === "delete" ? "#dc2626" : "#3b82f6") : "",
    shadowBlur: isHovered ? 8 : 0,
    shadowOpacity: isHovered ? 0.35 : 0,
  };

  const workplaceLabel =
    String(object.name || "").match(/\d+/)?.[0] ||
    String(object.name || "").slice(0, 2) ||
    "•";

  const renderShape = () => {
    if (object.type === "Рабочее место") {
      const size = Math.max(object.width || 36, object.height || 36);
      return (
        <>
          <Rect
            {...commonProps}
            width={size}
            height={size}
            fill={colors.fill}
            stroke={isSelected ? "#0f172a" : colors.stroke}
            strokeWidth={isSelected ? 2.5 : 2}
            cornerRadius={size / 2}
          />
          <Text
            x={object.x}
            y={object.y}
            width={size}
            height={size}
            text={workplaceLabel}
            fontSize={Math.max(11, size * 0.35)}
            fontStyle="bold"
            fill="#166534"
            align="center"
            verticalAlign="middle"
            listening={false}
          />
        </>
      );
    }

    if (object.type === "Дверь") {
      return (
        <Rect
          {...commonProps}
          width={object.width}
          height={Math.max(object.height, 12)}
          fill={colors.fill}
          stroke={isSelected ? "#0f172a" : colors.stroke}
          strokeWidth={isSelected ? 2 : 1}
          cornerRadius={2}
          opacity={0.95}
        />
      );
    }

    if (["Стена", "Кабинет", "Переговорная", "Этаж"].includes(object.type)) {
      const isWall = object.type === "Стена";
      return (
        <>
          <Rect
            {...commonProps}
            width={object.width}
            height={object.height}
            fill={colors.fill}
            stroke={isSelected ? "#0f172a" : colors.stroke}
            strokeWidth={isWall ? (isSelected ? 2 : 0) : isSelected ? 2.5 : 1.5}
            cornerRadius={isWall ? 1 : 4}
            opacity={isWall ? 1 : 0.92}
          />
          {!isWall && object.name && (
            <Text
              x={object.x + 8}
              y={object.y + 8}
              text={String(object.name).toUpperCase()}
              fontSize={12}
              fontStyle="bold"
              fill={colors.label || "#334155"}
              listening={false}
              opacity={0.85}
            />
          )}
        </>
      );
    }

    return (
      <Image
        {...commonProps}
        image={image}
        scaleX={object.scaleX || 1}
        scaleY={object.scaleY || 1}
        width={(object.width || 64) / (object.scaleX || 1)}
        height={(object.height || 64) / (object.scaleY || 1)}
      />
    );
  };

  return (
    <>
      {showListInfo && infoText && object.type !== "Стена" && (
        <Label x={object.x + (object.width || 40) + 8} y={object.y - 4}>
          <Tag
            fill="#0f172a"
            cornerRadius={6}
            shadowColor="black"
            shadowBlur={8}
            shadowOpacity={0.15}
          />
          <Text
            text={infoText}
            fontSize={11}
            padding={8}
            fill="#f8fafc"
            width={180}
          />
        </Label>
      )}
      {renderShape()}
      {isSelected && !object.isLocked && !noedit && activeTool !== "delete" && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={isShape ? object.type !== "Рабочее место" : true}
          enabledAnchors={
            object.type === "Рабочее место"
              ? ["top-left", "top-right", "bottom-left", "bottom-right"]
              : undefined
          }
          onTransformEnd={handleTransformEnd}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 8 || newBox.height < 8) return oldBox;
            return newBox;
          }}
          borderStroke="#0f172a"
          anchorStroke="#0f172a"
          anchorFill="#fff"
          anchorSize={8}
          rotateAnchorOffset={18}
        />
      )}
    </>
  );
};

export default EditableIcon;
