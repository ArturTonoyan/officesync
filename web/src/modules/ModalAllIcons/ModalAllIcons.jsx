import { AnimatePresence, motion } from "framer-motion";
import styles from "./ModalAllIcons.module.scss";
function ModalAllIcons({ title, show, setShow, funCliclImg }) {
  // Используем require.context для загрузки всех иконок из папки public/icons
  const importAll = (r) => {
    let icons = {};
    r.keys().forEach((item) => {
      icons[item.replace("./", "")] = r(item);
    });
    return icons;
  };

  const icons = importAll(
    require.context("./../../assets/images/conva", false, /\.(png|jpe?g|svg)$/)
  );

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={styles.ModalAllIcons}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={styles.container}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            {title && <h2>{title}</h2>}
            <div className={styles.content}>
              {Object.keys(icons).map((iconName) => (
                <div
                  key={iconName}
                  className={styles.icon}
                  onClick={() => funCliclImg(icons[iconName])}
                >
                  <img src={icons[iconName]} alt={iconName} />
                </div>
              ))}
            </div>
            <div className={styles.btn}>
              <button onClick={() => setShow(false)}>Закрыть</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ModalAllIcons;
