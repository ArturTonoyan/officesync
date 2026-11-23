import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Cylinder,
  Text as DreiText,
  Environment,
  Box,
} from "@react-three/drei";
import { Suspense, useMemo } from "react";

const WALL_H = 28;
const SCALE = 0.08;

function toScene(obj: {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}) {
  const w = (obj.width || 40) * SCALE;
  const d = (obj.height || 40) * SCALE;
  const x = (obj.x + (obj.width || 0) / 2) * SCALE;
  const z = (obj.y + (obj.height || 0) / 2) * SCALE;
  const rot = -((obj.rotation || 0) * Math.PI) / 180;
  return { w, d, x, z, rot };
}

function MapMesh({ obj }: { obj: any }) {
  const { w, d, x, z, rot } = toScene(obj);
  const type = obj.type;

  if (type === "Стена") {
    return (
      <mesh position={[x, WALL_H * SCALE * 0.5, z]} rotation={[0, rot, 0]} castShadow receiveShadow>
        <boxGeometry args={[Math.max(w, 0.15), WALL_H * SCALE, Math.max(d, 0.15)]} />
        <meshStandardMaterial color="#5B6472" roughness={0.85} />
      </mesh>
    );
  }

  if (type === "Кабинет" || type === "Переговорная" || type === "Этаж") {
    const color =
      type === "Переговорная" ? "#B2DFDB" : type === "Кабинет" ? "#D6E0F0" : "#E8ECF2";
    return (
      <group position={[x, 0.02, z]} rotation={[0, rot, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color={color} transparent opacity={0.92} />
        </mesh>
        <mesh position={[0, WALL_H * SCALE * 0.35, -d / 2]} castShadow>
          <boxGeometry args={[w, WALL_H * SCALE * 0.7, 0.08]} />
          <meshStandardMaterial color="#CBD5E1" transparent opacity={0.55} />
        </mesh>
        {obj.name && (
          <DreiText
            position={[0, 0.5, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.55}
            color="#334155"
            anchorX="center"
            anchorY="middle"
            maxWidth={w * 0.9}
          >
            {String(obj.name)}
          </DreiText>
        )}
      </group>
    );
  }

  if (type === "Рабочее место") {
    const r = Math.max(w, d) * 0.45;
    const label = String(obj.name || "").match(/\d+/)?.[0] || "";
    return (
      <group position={[x, 0, z]}>
        <Cylinder args={[r, r, 0.12, 24]} position={[0, 0.08, 0]} castShadow>
          <meshStandardMaterial color="#22C55E" />
        </Cylinder>
        <Cylinder args={[r * 0.85, r * 0.85, 0.05, 24]} position={[0, 0.15, 0]}>
          <meshStandardMaterial color="#ECFDF5" />
        </Cylinder>
        {label && (
          <DreiText
            position={[0, 0.35, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.4}
            color="#166534"
            anchorX="center"
            anchorY="middle"
          >
            {label}
          </DreiText>
        )}
      </group>
    );
  }

  if (type === "Дверь") {
    return (
      <mesh position={[x, WALL_H * SCALE * 0.35, z]} rotation={[0, rot, 0]} castShadow>
        <boxGeometry args={[Math.max(w, 0.2), WALL_H * SCALE * 0.7, Math.max(d, 0.08)]} />
        <meshStandardMaterial color="#A8A29E" />
      </mesh>
    );
  }

  // Furniture / equipment / other — stylized boxes
  const isChair = /стул|кресл|chair/i.test(obj.name || "") || (w < 0.9 && d < 0.9);
  const color =
    type === "Оборудование"
      ? "#64748B"
      : type === "Сотрудник"
        ? "#3B82F6"
        : isChair
          ? "#3B82F6"
          : "#E2E8F0";
  const height = type === "Оборудование" ? 1.1 : isChair ? 0.7 : 0.55;

  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Box args={[w, height, d]} position={[0, height / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.7} />
      </Box>
      {type === "Мебель" && (
        <Box args={[w * 0.92, 0.05, d * 0.92]} position={[0, height + 0.03, 0]}>
          <meshStandardMaterial color="#F8FAFC" />
        </Box>
      )}
    </group>
  );
}

function Scene({ objects }: { objects: any[] }) {
  const center = useMemo(() => {
    if (!objects?.length) return [8, 0, 8] as [number, number, number];
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    objects.forEach((o) => {
      minX = Math.min(minX, o.x);
      minY = Math.min(minY, o.y);
      maxX = Math.max(maxX, o.x + (o.width || 0));
      maxY = Math.max(maxY, o.y + (o.height || 0));
    });
    return [
      ((minX + maxX) / 2) * SCALE,
      0,
      ((minY + maxY) / 2) * SCALE,
    ] as [number, number, number];
  }, [objects]);

  const sorted = useMemo(
    () => [...(objects || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)),
    [objects],
  );

  return (
    <>
      <color attach="background" args={["#E8EDF5"]} />
      <ambientLight intensity={0.65} />
      <directionalLight
        position={[40, 60, 20]}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight args={["#f8fafc", "#94a3b8", 0.35]} />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[center[0], 0, center[2]]}
        receiveShadow
      >
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#F1F5F9" />
      </mesh>

      {/* subtle floor wood plank feel */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center[0], 0.01, center[2]]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#E7DFD2" transparent opacity={0.55} />
      </mesh>

      {sorted.map((obj) => (
        <MapMesh key={obj.id} obj={obj} />
      ))}

      <OrbitControls
        makeDefault
        target={center}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={4}
        maxDistance={80}
        enableDamping
      />
      <Environment preset="city" />
    </>
  );
}

function Floor3D({ objects }: { objects: any[] }) {
  const center = useMemo(() => {
    if (!objects?.length) return [8, 12, 18] as [number, number, number];
    let sx = 0,
      sy = 0;
    objects.forEach((o) => {
      sx += (o.x + (o.width || 0) / 2) * SCALE;
      sy += (o.y + (o.height || 0) / 2) * SCALE;
    });
    const cx = sx / objects.length;
    const cz = sy / objects.length;
    return [cx + 14, 16, cz + 14] as [number, number, number];
  }, [objects]);

  return (
    <div className="absolute inset-0 z-[1] bg-[linear-gradient(160deg,#e8edf5_0%,#d5dce8_45%,#c8d0de_100%)] [&_canvas]:!h-full [&_canvas]:!w-full">
      <Canvas shadows camera={{ position: center, fov: 42, near: 0.1, far: 500 }}>
        <Suspense fallback={null}>
          <Scene objects={objects} />
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/72 px-3.5 py-2 text-xs tracking-[-0.01em] text-slate-50 backdrop-blur-sm">
        ЛКМ — вращение · ПКМ — панорама · Колесо — масштаб
      </div>
    </div>
  );
}

export default Floor3D;