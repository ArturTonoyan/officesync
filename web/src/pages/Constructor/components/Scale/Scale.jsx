import styles from "./Scale.module.scss";

function Scale({ scale, setScale }) {
  const funPlus = () => {
    let newScale = scale + 0.1;
    if (newScale > 1) newScale = 1;
    setScale(newScale);
  };

  const funMinus = () => {
    let newScale = scale - 0.1;
    if (newScale < 0.1) newScale = 0.1;
    setScale(newScale);
  };

  return (
    <div className={styles.Scale}>
      <button onClick={funMinus}>-</button>
      <span>{(scale * 100).toFixed(0)}%</span>
      <button onClick={funPlus}>+</button>
    </div>
  );
}

export default Scale;
