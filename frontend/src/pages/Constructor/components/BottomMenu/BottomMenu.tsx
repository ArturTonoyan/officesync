import { Button } from "@components/ui";

function BottomMenu({ setModalAddEquipment }) {
  return (
    <div className="fixed bottom-7 left-1/2 z-[95] -translate-x-1/2">
      <div className="flex flex-row gap-3">
        <Button
          className="rounded-md px-7 shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
          onClick={() => setModalAddEquipment(true)}
        >
          Добавить объект
        </Button>
      </div>
    </div>
  );
}

export default BottomMenu;