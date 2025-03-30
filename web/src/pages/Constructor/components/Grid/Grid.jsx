import { Rect } from "react-konva";

function Grid() {
  const cellSize = 25;
  const size = {
    width: 10000,
    height: 10000,
  };

  return (
    <>
      {Array.from({ length: Math.ceil(size.width / cellSize) }).map((_, i) => (
        <Rect
          key={`v-${i}`}
          x={i * cellSize - size.width / 2}
          y={0 - size.height / 2}
          width={1}
          height={size.height}
          fill="lightgray"
        />
      ))}
      {/* Горизонтальные линии */}
      {Array.from({ length: Math.ceil(size.height / cellSize) }).map((_, i) => (
        <Rect
          key={`h-${i}`}
          x={0 - size.width / 2}
          y={i * cellSize - size.height / 2}
          width={size.width}
          height={1}
          fill="lightgray"
        />
      ))}
    </>
  );
}

export default Grid;
