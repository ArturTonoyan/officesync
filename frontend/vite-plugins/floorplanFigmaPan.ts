import type { Plugin } from "vite";

/**
 * 2D editor + 3D OrbitControls: trackpad two-finger scroll pans (Figma-like).
 * Patches both source modules and any Vite prebundle that inlined them.
 */

const NEEDLE_2D = `function ye(L) {
    if (t.wheelEnabled && !t.wheelEnabled()) return;
    L.preventDefault();
    const oe = M(L.clientX, L.clientY), fe = L.deltaMode === 1 ? 0.05 : L.ctrlKey ? 0.01 : 18e-4;
    E(oe.x, oe.y, Math.exp(-L.deltaY * fe));
  }`;

const REPLACEMENT_2D = `function ye(L) {
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

const ORBIT_WHEEL_RE =
  /function onMouseWheel\(\s*event\s*\)\s*\{\s*if\s*\(\s*this\.enabled\s*===\s*false\s*\|\|\s*this\.enableZoom\s*===\s*false\s*\|\|\s*this\.state\s*!==\s*_STATE\.NONE\s*\)\s*return;\s*event\.preventDefault\(\);\s*this\.dispatchEvent\(\s*_startEvent\s*\);\s*this\._handleMouseWheel\(\s*this\._customWheelEvent\(\s*event\s*\)\s*\);\s*this\.dispatchEvent\(\s*_endEvent\s*\);\s*\}/;

const ORBIT_WHEEL_REPLACEMENT = `function onMouseWheel( event ) {
	// OS_FIGMA_PAN_3D
	if ( this.enabled === false || this.state !== _STATE.NONE ) return;
	event.preventDefault();
	this.dispatchEvent( _startEvent );
	if ( ! event.ctrlKey && ! event.metaKey && event.deltaMode === 0 ) {
		if ( this.enablePan !== false ) {
			this._pan( - event.deltaX * this.panSpeed, event.deltaY * this.panSpeed );
			this.update();
		}
		this.dispatchEvent( _endEvent );
		return;
	}
	if ( this.enableZoom === false ) {
		this.dispatchEvent( _endEvent );
		return;
	}
	this._handleMouseWheel( this._customWheelEvent( event ) );
	this.dispatchEvent( _endEvent );
}`;

const VIEWER_3D_INIT_RE =
  /R\.enableDamping\s*=\s*!0\s*,\s*R\.dampingFactor\s*=\s*0\.08\s*,\s*R\.maxPolarAngle\s*=\s*Math\.PI\s*\/\s*2\s*-\s*0\.06\s*,\s*R\.screenSpacePanning\s*=\s*!1\s*,/;

const VIEWER_3D_INIT_REPLACEMENT =
  `R.enableDamping = !0, R.dampingFactor = 0.08, R.maxPolarAngle = Math.PI / 2 - 0.06, R.screenSpacePanning = !0, R.panSpeed = 1.2 /* OS_FIGMA_PAN_3D_INIT */,`;

function patchAll(code: string): string | null {
  let next = code;
  let changed = false;

  if (
    next.includes("function ye(L)") &&
    !next.includes("Figma-like: trackpad") &&
    next.includes(NEEDLE_2D)
  ) {
    next = next.replace(NEEDLE_2D, REPLACEMENT_2D);
    changed = true;
  }

  if (!next.includes("OS_FIGMA_PAN_3D") && ORBIT_WHEEL_RE.test(next)) {
    next = next.replace(ORBIT_WHEEL_RE, ORBIT_WHEEL_REPLACEMENT);
    changed = true;
  }

  if (
    !next.includes("OS_FIGMA_PAN_3D_INIT") &&
    VIEWER_3D_INIT_RE.test(next)
  ) {
    next = next.replace(VIEWER_3D_INIT_RE, VIEWER_3D_INIT_REPLACEMENT);
    changed = true;
  }

  return changed ? next : null;
}

export function floorplanFigmaPan(): Plugin {
  return {
    name: "floorplan-figma-pan",
    enforce: "pre",
    transform(code, id) {
      const normalized = id.replace(/\\/g, "/");
      const relevant =
        normalized.includes("@jbaysolutions/floorplan") ||
        normalized.includes("OrbitControls") ||
        normalized.includes("floorplan-elements") ||
        normalized.includes(".vite/deps");
      if (!relevant) return null;
      const next = patchAll(code);
      if (!next) return null;
      return { code: next, map: null };
    },
  };
}
