import { Button } from "@components/ui";

function Scale({ scale, setScale }) {
  const funPlus = () => {
    let newScale = scale + 0.1;
    if (newScale > 2) newScale = 2;
    setScale(newScale);
  };

  const funMinus = () => {
    let newScale = scale - 0.1;
    if (newScale < 0.1) newScale = 0.1;
    setScale(newScale);
  };

  return (
    <div className="fixed bottom-5 right-5 flex flex-row items-center gap-1.5 rounded-[20px] bg-white p-2.5">
      <Button
        variant="secondary"
        className="h-[50px] w-[60px] text-2xl font-bold"
        onClick={funMinus}
      >
        -
      </Button>
      <span className="w-[60px] text-center text-lg font-semibold">
        {(scale * 100).toFixed(0)}%
      </span>
      <Button
        variant="secondary"
        className="h-[50px] w-[60px] text-2xl font-bold"
        onClick={funPlus}
      >
        +
      </Button>
    </div>
  );
}

export default Scale;