import type { FloorPlan, Furniture, Marker } from "@jbaysolutions/floorplan-react";
import type { Pt } from "../AutoPlan/layout/geometry";

export const EVAC_POSTER_KIND = "office/evacuation-map";
/** Этажный план по ГОСТ 34428-2018 / ГОСТ Р 12.2.143: 600×400 мм */
export const EVAC_POSTER_FLOOR_CM = { width: 60, depth: 4 };
/** Локальный план: 400×300 мм */
export const EVAC_POSTER_LOCAL_CM = { width: 40, depth: 4 };

export type EvacExit = {
  id: string;
  point: Pt;
  roomId: string;
  openingId: string;
  /** Основной эвакуационный выход (сплошная зелёная) vs запасной (штриховая) */
  primary: boolean;
};

export type EvacRoute = {
  points: Pt[];
  primary: boolean;
  fromRoomId: string;
  toExitId: string;
};

export type EvacPosterSpot = {
  roomId: string;
  point: Pt;
  rotation: number;
  local: boolean;
};

export type EvacSafetyItem = {
  kind: "extinguisher" | "first-aid" | "poster";
  point: Pt;
  label: string;
};

export type EvacuationAnalysis = {
  rooms: { id: string; name: string; points: Pt[]; role: string }[];
  exits: EvacExit[];
  routes: EvacRoute[];
  posters: EvacPosterSpot[];
  safety: EvacSafetyItem[];
  walls: { start: Pt; end: Pt; thickness: number }[];
  furniture: { x: number; y: number; width: number; depth: number; rotation: number; kind: string }[];
  floorLabel: string;
  warnings: string[];
};

export type GenerateEvacuationResult = {
  plan: FloorPlan;
  markers: Marker[];
  analysis: EvacuationAnalysis;
  svg: string;
  report: string[];
  postersPlaced: Furniture[];
};
