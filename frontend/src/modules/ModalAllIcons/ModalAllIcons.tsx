import { AnimatePresence, motion } from "framer-motion";
import { MAP_ICONS } from "../../pages/Constructor/utils/mapIcons";
import { Button } from "@components/ui";

const legacyModules = import.meta.glob(
  "../../assets/images/conva/*.{svg,png,jpg,jpeg}",
  { eager: true, import: "default" },
) as Record<string, string>;

function ModalAllIcons({ title, show, setShow, funCliclImg }) {
  const neatIcons = Object.entries(MAP_ICONS).map(([name, src]) => ({
    name: `neat/${name}`,
    src,
  }));

  const legacyIcons = Object.entries(legacyModules).map(([path, src]) => ({
    name: path.split("/").pop() || path,
    src,
  }));

  const icons = [...neatIcons, ...legacyIcons];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[10000] box-border flex h-full w-full items-start justify-center overflow-y-auto bg-[rgba(17,17,17,0.35)] p-10 px-5 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="mt-[100px] box-border h-max max-h-[80vh] w-full overflow-hidden overflow-y-auto rounded-md border border-line bg-elevated p-[50px_30px] shadow-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
          >
            {title && (
              <h2 className="mb-[60px] text-fg">{title}</h2>
            )}
            <div className="flex max-w-[60vw] flex-wrap">
              {icons.map((icon) => (
                <div
                  key={icon.name}
                  className="m-2.5 h-[50px] w-[50px] cursor-pointer p-2.5 transition-opacity duration-150 hover:opacity-60 active:opacity-100"
                  onClick={() => funCliclImg(icon.src)}
                  title={icon.name}
                >
                  <img
                    className="h-full w-full"
                    src={icon.src}
                    alt={icon.name}
                  />
                </div>
              ))}
            </div>
            <div className="mt-10 box-border flex w-full flex-row justify-end pr-5">
              <Button className="min-w-[120px] px-[60px]" onClick={() => setShow(false)}>
                Закрыть
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ModalAllIcons;