import { AnimatePresence, motion } from "framer-motion";
import styles from "./ModalAddOfice.module.scss";

function ModalAddOfice({ title, inputs, show, setShow }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={styles.ModalAddOfice}
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
            <div className={styles.form}>
              {inputs.map((item, index) => (
                <div className={styles.input_box} name={item.key}>
                  <span className={styles.name}>{item.name}</span>
                  <div className={styles.input}>
                    <input
                      key={index}
                      type={item.type}
                      autoComplete="new-password"
                      placeholder="Не указанно"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.btn}>
              <button className={styles.cancel} onClick={() => setShow(false)}>
                Отменить
              </button>
              <button className={styles.save}>Сохранить</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ModalAddOfice;
