import { Line, Rect } from "react-konva";

const CELL = 40;
const MAJOR = 5;
const HALF = 4000;

function Grid() {
  const lines = [];

  for (let i = -HALF; i <= HALF; i += CELL) {
    const isMajor = i % (CELL * MAJOR) === 0;
    const stroke = isMajor ? "#D8DEE8" : "#E9EEF5";
    const strokeWidth = isMajor ? 1.25 : 0.75;

    lines.push(
      <Line
        key={`v-${i}`}
        points={[i, -HALF, i, HALF]}
        stroke={stroke}
        strokeWidth={strokeWidth}
        listening={false}
      />,
      <Line
        key={`h-${i}`}
        points={[-HALF, i, HALF, i]}
        stroke={stroke}
        strokeWidth={strokeWidth}
        listening={false}
      />,
    );
  }

  return (
    <>
      <Rect
        x={-HALF}
        y={-HALF}
        width={HALF * 2}
        height={HALF * 2}
        fill="#F4F6FA"
        listening={false}
      />
      {lines}
      <Rect
        x={-2}
        y={-2}
        width={4}
        height={4}
        fill="#94A3B8"
        listening={false}
      />
    </>
  );
}

export default Grid;
