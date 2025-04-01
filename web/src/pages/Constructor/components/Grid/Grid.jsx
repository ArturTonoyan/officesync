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
{
  /* Background Image */
}
{
  /* {image && (
            <>
              <Image
                image={image}
                width={8858 / 2}
                height={5906 / 2}
                draggable={false}
                x={-8858 / 4}
                y={-5906 / 4}
              />
              <Image
                image={image}
                width={8858 / 2}
                height={5906 / 2}
                draggable={false}
                x={-8693 / 2}
                y={-5906 / 4}
              />
              <Image
                image={image}
                width={8858 / 2}
                height={5906 / 2}
                draggable={false}
                x={-8856 / 4}
                y={1477}
              />
              <Image
                image={image}
                width={8858 / 2}
                height={5906 / 2}
                draggable={false}
                x={-4346.5}
                y={1476}
              />
            </>
          )} */
}
// import bg from "./../../../../assets/images/bg/bg.jpg";

// const [image, setImage] = useState(null);

// // Load the background image
// useEffect(() => {
//   const img = new window.Image();
//   img.src = bg; // Replace with your image path
//   img.onload = () => {
//     setImage(img);
//   };
// }, []);
