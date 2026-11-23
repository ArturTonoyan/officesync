import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect } from "react-konva";
import Scale from "../../components/Scale/Scale";
import BottomMenu from "../../components/BottomMenu/BottomMenu";
import EditableIcon from "../../components/EditableIcon/EditableIcon";
import ModalAddObject from "../../components/ModalAddObject/ModalAddObject";
import RightMenu from "../RightMenu/RightMenu";
import TopMenu from "../TopMenu/TopMenu";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@store/hooks";
import {
  setObjects,
  setSelected,
  setSelectedFloor,
  setSelectedOffice,
} from "../../../../store/convaSlice/conva.Slice";
import LeftMenu from "../LeftMenu/LeftMenu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiEddElements,
  apiGetElements,
  apiGetFloors,
  apiGetOffices,
  apiUpdateFloorImage,
} from "../../../../api/apirequests";
import { useSearchParams } from "react-router-dom";
import Grid from "../../components/Grid/Grid";
import ToolsToolbar, {
  type EditorTool,
} from "../../components/ToolsToolbar/ToolsToolbar";
import FurniturePalette from "../../components/FurniturePalette/FurniturePalette";
import ModeToggle, {
  type ViewMode,
} from "../../components/ModeToggle/ModeToggle";
import Floor3D from "../../components/Floor3D/Floor3D";
import {
  createMapElement,
  removeMapElement,
} from "../../utils/createMapElement";
import {
  FURNITURE_PRESETS,
  MAP_ICONS,
  type MapIconKey,
} from "../../utils/mapIcons";

const WALL_THICKNESS = 14;

function ConvasSpace({ noedit, setSelectedRoom }) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const user = useAppSelector((state) => state.user.user.data);
  const conva = useAppSelector((state) => state.conva);
  const [scale, setScale] = useState(1);
  const stageRef = useRef(null);
  const [modalAddEquipment, setModalAddEquipment] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saveAction, setSaveAction] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("2d");
  const [activeTool, setActiveTool] = useState<EditorTool>("select");
  const [furnitureKey, setFurnitureKey] = useState<MapIconKey>("desk");
  const [draft, setDraft] = useState(null);
  const drawingRef = useRef(false);

  const { data: offices, refetch: refetchOffices } = useQuery({
    queryKey: ["offices/all/id", user?.companyId],
    queryFn: () => apiGetOffices(user?.companyId),
    staleTime: Infinity,
    enabled: !!user?.companyId,
  });

  const { data: floors, refetch: refetchFloors } = useQuery({
    queryKey: ["offices", user?.companyId],
    queryFn: () => apiGetFloors(user?.companyId),
    staleTime: Infinity,
    enabled: !!user?.companyId,
  });

  useEffect(() => {
    if (!offices?.data?.length) return;

    const officeFromUrl = searchParams.get("office");
    const floorFromUrl = searchParams.get("floor");

    if (officeFromUrl) {
      const officeExists = offices.data.some((o) => o.id === officeFromUrl);
      if (officeExists && conva.offices.selected !== officeFromUrl) {
        dispatch(
          setSelectedOffice({ id: officeFromUrl, offices: offices.data }),
        );
      }
      if (floorFromUrl && floors?.data?.length) {
        const floorExists = floors.data.some((f) => f.id === floorFromUrl);
        if (floorExists && conva.floors.selected !== floorFromUrl) {
          dispatch(
            setSelectedFloor({ id: floorFromUrl, floors: floors.data }),
          );
        }
      }
      return;
    }

    if (conva.offices.selected) return;

    const preferredOffice =
      offices.data.find((office) => office.id === user?.officeId) ||
      offices.data[0];

    dispatch(
      setSelectedOffice({ id: preferredOffice.id, offices: offices.data }),
    );

    const officeFloors = [...(preferredOffice.floors || [])].sort(
      (a, b) => a.number - b.number,
    );
    const preferredFloor =
      officeFloors.find((floor) => floor.id === user?.floorId) ||
      officeFloors[0];

    if (preferredFloor && floors?.data?.length) {
      dispatch(
        setSelectedFloor({ id: preferredFloor.id, floors: floors.data }),
      );
    }
  }, [
    offices?.data,
    floors?.data,
    user?.officeId,
    user?.floorId,
    conva.offices.selected,
    conva.floors.selected,
    searchParams,
    dispatch,
  ]);

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    if (newScale < 0.1) newScale = 0.1;
    if (newScale > 2) newScale = 2;
    setScale(newScale);

    stage.scale({ x: newScale, y: newScale });
    stage.position({
      x: pointer.x - (pointer.x - stage.x()) * (newScale / oldScale),
      y: pointer.y - (pointer.y - stage.y()) * (newScale / oldScale),
    });
  };

  const getPointerOnStage = () => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    const transform = stage.getAbsoluteTransform().copy().invert();
    return transform.point(pointer);
  };

  const snap = (v: number) => Math.round(v / 10) * 10;

  const placeAtClick = useCallback(
    async (pos: { x: number; y: number }) => {
      const floorId = conva?.floors?.selected;
      if (!floorId) return;

      if (activeTool === "workplace") {
        const count =
          (conva.objects.data || []).filter((o) => o.type === "Рабочее место")
            .length + 1;
        await createMapElement(
          {
            name: `Место ${count}`,
            type: "Рабочее место",
            iconKey: "workplace",
            x: snap(pos.x - 18),
            y: snap(pos.y - 18),
            width: 36,
            height: 36,
            zIndex: 550,
          },
          floorId,
          dispatch,
        );
        return;
      }

      if (activeTool === "door") {
        await createMapElement(
          {
            name: "Дверь",
            type: "Дверь",
            iconKey: "door",
            x: snap(pos.x - 6),
            y: snap(pos.y - 20),
            width: 12,
            height: 40,
            zIndex: 900,
          },
          floorId,
          dispatch,
        );
        return;
      }

      if (activeTool === "furniture") {
        const preset =
          FURNITURE_PRESETS.find((p) => p.key === furnitureKey) ||
          FURNITURE_PRESETS[0];
        await createMapElement(
          {
            name: preset.label,
            type: preset.type,
            image: MAP_ICONS[preset.key],
            x: snap(pos.x - preset.width / 2),
            y: snap(pos.y - preset.height / 2),
            width: preset.width,
            height: preset.height,
            zIndex: preset.zIndex,
          },
          floorId,
          dispatch,
        );
      }
    },
    [activeTool, conva.floors.selected, conva.objects.data, dispatch, furnitureKey],
  );

  const finishDraft = useCallback(
    async (box: { x: number; y: number; width: number; height: number }) => {
      const floorId = conva?.floors?.selected;
      if (!floorId) return;

      const minSize = activeTool === "wall" ? 20 : 40;
      if (Math.abs(box.width) < minSize && Math.abs(box.height) < minSize) {
        return;
      }

      const x = snap(Math.min(box.x, box.x + box.width));
      const y = snap(Math.min(box.y, box.y + box.height));
      let width = snap(Math.abs(box.width));
      let height = snap(Math.abs(box.height));

      if (activeTool === "wall") {
        if (width >= height) {
          height = WALL_THICKNESS;
        } else {
          width = WALL_THICKNESS;
        }
        await createMapElement(
          {
            name: "Стена",
            type: "Стена",
            iconKey: "wall",
            x,
            y,
            width: Math.max(width, WALL_THICKNESS),
            height: Math.max(height, WALL_THICKNESS),
            zIndex: 200,
          },
          floorId,
          dispatch,
        );
        return;
      }

      if (activeTool === "room" || activeTool === "meeting") {
        const isMeeting = activeTool === "meeting";
        const count =
          (conva.objects.data || []).filter((o) =>
            isMeeting ? o.type === "Переговорная" : o.type === "Кабинет",
          ).length + 1;
        await createMapElement(
          {
            name: isMeeting ? `Переговорная ${count}` : `Кабинет №${count}`,
            type: isMeeting ? "Переговорная" : "Кабинет",
            iconKey: isMeeting ? "meeting" : "room",
            x,
            y,
            width: Math.max(width, 60),
            height: Math.max(height, 60),
            zIndex: 300,
          },
          floorId,
          dispatch,
        );
      }
    },
    [activeTool, conva.floors.selected, conva.objects.data, dispatch],
  );

  const isEmptyCanvasTarget = (target) => {
    if (!target) return false;
    const name = typeof target.name === "function" ? target.name() : target.name;
    const className =
      typeof target.getClassName === "function" ? target.getClassName() : "";
    return (
      name === "floor-hit" ||
      className === "Stage" ||
      className === "Layer" ||
      target === stageRef.current
    );
  };

  const handleStageMouseDown = (e) => {
    if (noedit || viewMode !== "2d") return;

    const onEmpty = isEmptyCanvasTarget(e.target);
    if (!onEmpty && ["wall", "room", "meeting", "workplace", "furniture", "door"].includes(activeTool)) {
      return;
    }

    const pos = getPointerOnStage();
    if (!pos) return;

    if (["workplace", "furniture", "door"].includes(activeTool)) {
      placeAtClick(pos);
      return;
    }

    if (["wall", "room", "meeting"].includes(activeTool)) {
      drawingRef.current = true;
      setDraft({ x: pos.x, y: pos.y, width: 0, height: 0 });
      dispatch(setSelected(null));
    }
  };

  const handleStageMouseMove = () => {
    if (!drawingRef.current || !draft) return;
    const pos = getPointerOnStage();
    if (!pos) return;
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            width: pos.x - prev.x,
            height: pos.y - prev.y,
          }
        : null,
    );
  };

  const handleStageMouseUp = async () => {
    if (!drawingRef.current || !draft) return;
    drawingRef.current = false;
    const box = draft;
    setDraft(null);
    await finishDraft(box);
  };

  const handleStageClick = (e) => {
    if (noedit) return;
    if (activeTool !== "select") return;
    if (e.target === e.currentTarget || e.target?.name?.() === "floor-hit") {
      dispatch(setSelected(null));
    }
  };

  const funGetElem = () => {
    if (conva?.floors?.selected) {
      apiGetElements(conva?.floors?.selected).then((res) => {
        if (res.status === 200) dispatch(setObjects({ data: res.data }));
      });
    }
  };

  useEffect(() => {
    funGetElem();
  }, [conva?.floors?.selected]);

  const handleDownload = () => {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL();
    const link = document.createElement("a");
    link.download = "my-canvas.png";
    link.href = uri;
    link.click();
  };

  const funSave = async () => {
    setSaveAction(true);
    const qerydata = conva?.objects?.data?.map((obj) => ({
      ...obj,
      floorId: conva?.floors?.selected,
    }));
    apiEddElements(qerydata);
  };

  useEffect(() => {
    if (saveAction && viewMode === "2d") {
      const saveImage = async () => {
        if (!stageRef.current) {
          setSaveAction(false);
          return;
        }
        const uri = stageRef.current.toDataURL({
          mimeType: "image/png",
          pixelRatio: 2,
        });

        const blob = await fetch(uri).then((res) => res.blob());
        const formData = new FormData();
        formData.append("image", blob, "canvas.png");

        await apiUpdateFloorImage(formData, conva?.floors?.selected).then(
          () => {
            setSaveAction(false);
            queryClient.invalidateQueries({
              queryKey: ["floors/all/id", user?.companyId],
            });
            queryClient.invalidateQueries({
              queryKey: ["offices/all/id", user?.companyId],
            });
            refetchFloors();
            refetchOffices();
          },
        );
      };

      saveImage();
    } else if (saveAction) {
      setSaveAction(false);
    }
  }, [saveAction]);

  const canPan = activeTool === "select" || noedit;
  const draftFill =
    activeTool === "wall"
      ? "rgba(74, 85, 104, 0.55)"
      : activeTool === "meeting"
        ? "rgba(178, 223, 219, 0.45)"
        : "rgba(148, 163, 184, 0.28)";

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[radial-gradient(ellipse_at_20%_10%,rgba(148,163,184,0.12),transparent_45%),radial-gradient(ellipse_at_80%_90%,rgba(100,116,139,0.1),transparent_40%),#eef1f6]">
      {viewMode === "2d" ? (
        <Stage
          width={window.innerWidth}
          height={window.innerHeight}
          draggable={canPan}
          onWheel={!noedit && handleWheel}
          ref={stageRef}
          scaleX={scale}
          scaleY={scale}
          onClick={!noedit && handleStageClick}
          onMouseDown={!noedit ? handleStageMouseDown : undefined}
          onMouseMove={!noedit ? handleStageMouseMove : undefined}
          onMouseUp={!noedit ? handleStageMouseUp : undefined}
          className="cursor-crosshair"
        >
          <Layer>
            <Grid />
            <Rect
              name="floor-hit"
              x={-5000}
              y={-5000}
              width={10000}
              height={10000}
              fill="transparent"
            />
            {conva.objects.data &&
              [...conva.objects.data]
                .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                .map((object) => (
                  <EditableIcon
                    saveAction={saveAction}
                    key={object.id}
                    object={object}
                    noedit={noedit}
                    setSelectedRoom={setSelectedRoom}
                    activeTool={noedit ? "select" : activeTool}
                    onDeleteRequest={(id) => removeMapElement(id, dispatch)}
                  />
                ))}
            {draft && (
              <Rect
                x={Math.min(draft.x, draft.x + draft.width)}
                y={Math.min(draft.y, draft.y + draft.height)}
                width={Math.abs(draft.width)}
                height={Math.abs(draft.height)}
                fill={draftFill}
                stroke="#0f172a"
                strokeWidth={1.5}
                dash={[6, 4]}
                listening={false}
              />
            )}
          </Layer>
        </Stage>
      ) : (
        <Floor3D objects={conva.objects.data || []} />
      )}

      {!noedit && viewMode === "2d" && (
        <ToolsToolbar
          activeTool={activeTool}
          onChange={(tool) => {
            setActiveTool(tool);
            setDraft(null);
            drawingRef.current = false;
          }}
        />
      )}

      {!noedit && viewMode === "2d" && activeTool === "furniture" && (
        <FurniturePalette selected={furnitureKey} onSelect={setFurnitureKey} />
      )}

      {!noedit && viewMode === "2d" && (
        <BottomMenu setModalAddEquipment={setModalAddEquipment} />
      )}

      {viewMode === "2d" && <Scale scale={scale} setScale={setScale} />}

      {!noedit && viewMode === "2d" && (
        <RightMenu
          setModalAddEquipment={setModalAddEquipment}
          setEditItem={setEditData}
        />
      )}

      {!noedit && <LeftMenu />}

      <TopMenu
        floors={floors}
        offices={offices}
        funSave={funSave}
        funDownload={handleDownload}
        noedit={noedit}
        modeToggle={
          <ModeToggle
            mode={viewMode}
            onChange={(mode) => {
              setViewMode(mode as typeof viewMode);
              setActiveTool("select");
            }}
          />
        }
      />

      <ModalAddObject
        funGetElem={funGetElem}
        editData={editData}
        setEditData={setEditData}
        show={modalAddEquipment}
        setShow={setModalAddEquipment}
        title={editData?.id ? "Редактировать объект" : "Добавить объект"}
      />
    </div>
  );
}

export default ConvasSpace;
