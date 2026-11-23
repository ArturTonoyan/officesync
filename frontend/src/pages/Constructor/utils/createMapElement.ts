import { apiEddElement, apiDeleteElement } from "../../../api/apirequests";
import {
  addObjectApi,
  deleteObject,
  setSelected,
} from "../../../store/convaSlice/conva.Slice";
import { MAP_ICONS, type MapIconKey } from "./mapIcons";

export type NewMapElement = {
  name?: string;
  type: string;
  image?: string;
  iconKey?: MapIconKey;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex?: number;
  isLocked?: boolean;
};

export async function createMapElement(
  payload: NewMapElement,
  floorId: string,
  dispatch: (action: unknown) => void,
) {
  if (!floorId) return null;

  const imageSrc =
    payload.image ||
    (payload.iconKey ? MAP_ICONS[payload.iconKey] : "") ||
    "";

  const data = {
    name: payload.name || "Новый объект",
    type: payload.type,
    floorId,
    x: Math.round(payload.x),
    y: Math.round(payload.y),
    width: Math.round(payload.width),
    height: Math.round(payload.height),
    rotation: payload.rotation || 0,
    scaleX: 1,
    scaleY: 1,
    zIndex: payload.zIndex ?? 400,
    isLocked: payload.isLocked ?? false,
  };

  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  if (imageSrc.startsWith("data:")) {
    try {
      const blob = await fetch(imageSrc).then((r) => r.blob());
      formData.append("image", blob, `${payload.iconKey || "icon"}.svg`);
    } catch {
      formData.append("image", imageSrc);
    }
  } else if (imageSrc) {
    formData.append("image", imageSrc);
  }

  const res = await apiEddElement(formData);
  if (res?.status === 201) {
    dispatch(addObjectApi({ data: res.data }));
    dispatch(setSelected(res.data.id));
    return res.data;
  }
  return null;
}

export async function removeMapElement(
  id: string,
  dispatch: (action: unknown) => void,
) {
  const res = await apiDeleteElement(id);
  if (res?.status === 200 || res?.status === 204) {
    dispatch(deleteObject(id));
  }
}
