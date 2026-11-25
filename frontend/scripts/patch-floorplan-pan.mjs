/**
 * Re-applies Figma-like trackpad pan to @jbaysolutions/floorplan-elements after install.
 * (Two-finger scroll → pan; pinch / Ctrl·Cmd+wheel → zoom.)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const NEEDLE = `function ye(L) {
    if (t.wheelEnabled && !t.wheelEnabled()) return;
    L.preventDefault();
    const oe = M(L.clientX, L.clientY), fe = L.deltaMode === 1 ? 0.05 : L.ctrlKey ? 0.01 : 18e-4;
    E(oe.x, oe.y, Math.exp(-L.deltaY * fe));
  }`;

const REPLACEMENT = `function ye(L) {
    if (t.wheelEnabled && !t.wheelEnabled()) return;
    L.preventDefault();
    // Figma-like: trackpad two-finger scroll pans; pinch / ctrl+wheel zooms
    if (!L.ctrlKey && !L.metaKey && L.deltaMode === 0) {
      Q(), a.x -= L.deltaX, a.y -= L.deltaY;
      return;
    }
    const oe = M(L.clientX, L.clientY), fe = L.deltaMode === 1 ? 0.05 : L.ctrlKey || L.metaKey ? 0.01 : 18e-4;
    E(oe.x, oe.y, Math.exp(-L.deltaY * fe));
  }`;

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(
  frontendRoot,
  "node_modules/@jbaysolutions/floorplan-elements/dist",
);
if (!existsSync(distDir)) {
  console.warn("[patch-floorplan-pan] package not installed, skip");
  process.exit(0);
}

const chunk =
  readdirSync(distDir).find(
    (f) => f.startsWith("element-") && f.endsWith(".js"),
  ) ?? null;
const target = chunk ? join(distDir, chunk) : null;
if (!target || !existsSync(target)) {
  console.warn("[patch-floorplan-pan] element chunk missing, skip");
  process.exit(0);
}

const code = readFileSync(target, "utf8");
if (code.includes("Figma-like: trackpad")) {
  console.log("[patch-floorplan-pan] already applied");
  process.exit(0);
}
if (!code.includes(NEEDLE)) {
  console.warn(
    "[patch-floorplan-pan] wheel handler changed upstream — update scripts/patch-floorplan-pan.mjs and vite-plugins/floorplanFigmaPan.ts",
  );
  process.exit(0);
}

writeFileSync(target, code.replace(NEEDLE, REPLACEMENT));
console.log("[patch-floorplan-pan] applied");
