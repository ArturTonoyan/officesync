/**
 * Shared OrbitControls registry.
 * Uses window so app code and Vite-prebundled OrbitControls share one instance
 * (module graphs can otherwise duplicate the registry).
 */

const KEY = "__fpOrbitControls";
const LISTENERS = "__fpOrbitControlsListeners";

function store() {
  if (typeof window === "undefined") {
    return { active: null, listeners: new Set() };
  }
  if (!window[LISTENERS]) window[LISTENERS] = new Set();
  return {
    get active() {
      return window[KEY] || null;
    },
    set active(v) {
      window[KEY] = v;
    },
    get listeners() {
      return window[LISTENERS];
    },
  };
}

export function registerOrbitControls(controls) {
  const s = store();
  s.active = controls;
  for (const fn of s.listeners) {
    try {
      fn(controls);
    } catch {
      /* ignore */
    }
  }
}

export function unregisterOrbitControls(controls) {
  const s = store();
  if (s.active === controls) s.active = null;
}

export function getActiveOrbitControls() {
  return store().active;
}

export function subscribeOrbitControls(fn) {
  const s = store();
  s.listeners.add(fn);
  if (s.active) {
    try {
      fn(s.active);
    } catch {
      /* ignore */
    }
  }
  return () => s.listeners.delete(fn);
}
