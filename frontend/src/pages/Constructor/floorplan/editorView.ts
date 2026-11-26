/** Сохранение / восстановление камеры 2D-редактора (после внешнего setPlan он зовёт fit()). */

export type EditorView = { x: number; y: number; k: number };

type PanController = {
  view: EditorView;
  setView: (view: EditorView, animate?: boolean) => void;
  stopAnimation?: () => void;
  fitBounds: (...args: unknown[]) => void;
  __osWrapped?: boolean;
  __osOrigFitBounds?: (...args: unknown[]) => void;
};

/** Пока не null — любой fitBounds/анимированный setView сбрасывается на этот view. */
let frozenView: EditorView | null = null;
let freezeTimer: ReturnType<typeof setTimeout> | null = null;
let wrappedPan: PanController | null = null;

function worldGroup(host: HTMLElement | null): SVGGElement | null {
  if (!host) return null;
  return (
    [...host.querySelectorAll<SVGGElement>("g[transform]")].find((el) =>
      /translate\([^)]+\)\s*scale\(/.test(el.getAttribute("transform") || ""),
    ) || null
  );
}

function panFromSetup(setup: Record<string, unknown>): PanController | null {
  for (const val of Object.values(setup)) {
    if (!val || typeof val !== "object") continue;
    const v = val as Record<string, unknown>;
    if (typeof v.setView !== "function" || typeof v.fitBounds !== "function") {
      continue;
    }
    if (!v.view || typeof v.view !== "object") continue;
    const view = v.view as EditorView;
    if (!("x" in view && "y" in view && "k" in view)) continue;
    return v as unknown as PanController;
  }
  return null;
}

type VueComp = {
  setupState?: Record<string, unknown>;
  parent?: VueComp | null;
  vnode?: { el?: Node | null };
};

function vueCompFromEl(el: Element | null): VueComp | null {
  if (!el) return null;
  return (
    (
      el as HTMLElement & {
        __vueParentComponent?: VueComp;
      }
    ).__vueParentComponent || null
  );
}

/** Pan-контроллер библиотеки (view / setView / fitBounds). */
export function findEditorPan(host: HTMLElement | null): PanController | null {
  if (!host) return null;

  const candidates: Element[] = [
    ...host.querySelectorAll(".fp-root"),
    ...host.querySelectorAll("floorplan-editor"),
    host,
  ];

  for (const el of candidates) {
    let comp = vueCompFromEl(el);
    let depth = 0;
    while (comp && depth < 12) {
      if (comp.setupState) {
        const pan = panFromSetup(comp.setupState);
        if (pan) {
          if (wrappedPan && wrappedPan !== pan) wrappedPan = null;
          return pan;
        }
      }
      comp = comp.parent || null;
      depth += 1;
    }
  }
  return wrappedPan;
}

function ensurePanWrapped(pan: PanController) {
  if (pan.__osWrapped) {
    wrappedPan = pan;
    return;
  }
  const origFit = pan.fitBounds.bind(pan);
  const origSetView = pan.setView.bind(pan);
  pan.__osOrigFitBounds = origFit;
  pan.fitBounds = ((...args: unknown[]) => {
    if (frozenView) {
      pan.stopAnimation?.();
      origSetView(frozenView, false);
      return;
    }
    return origFit(...args);
  }) as PanController["fitBounds"];
  pan.setView = ((view: EditorView, animate?: boolean) => {
    if (frozenView && animate !== false) {
      pan.stopAnimation?.();
      origSetView(frozenView, false);
      return;
    }
    if (frozenView && animate === false) {
      // разрешаем наш holdView
      return origSetView(view, false);
    }
    return origSetView(view, animate);
  }) as PanController["setView"];
  pan.__osWrapped = true;
  wrappedPan = pan;
}

export function captureEditorView(host: HTMLElement | null): EditorView | null {
  const pan = findEditorPan(host);
  if (pan?.view && Number.isFinite(pan.view.k) && pan.view.k > 0) {
    return { x: pan.view.x, y: pan.view.y, k: pan.view.k };
  }
  const g = worldGroup(host);
  if (!g) return null;
  const raw = g.getAttribute("transform") || "";
  const m =
    /translate\(\s*([-\d.eE]+)(?:[,\s]+)([-\d.eE]+)\s*\)\s*scale\(\s*([-\d.eE]+)/.exec(
      raw,
    );
  if (!m) return null;
  return { x: Number(m[1]), y: Number(m[2]), k: Number(m[3]) };
}

function applyView(host: HTMLElement, view: EditorView) {
  const pan = findEditorPan(host);
  if (pan) {
    ensurePanWrapped(pan);
    pan.stopAnimation?.();
    // напрямую в reactive view — минуя обёртки
    pan.view.x = view.x;
    pan.view.y = view.y;
    pan.view.k = view.k;
    return;
  }
  const g = worldGroup(host);
  if (g) {
    g.setAttribute(
      "transform",
      `translate(${view.x} ${view.y}) scale(${view.k})`,
    );
  }
}

/** Вернуть камеру после внешнего обновления plan (fit анимируется ~480ms). */
export function restoreEditorView(
  host: HTMLElement | null,
  view: EditorView | null,
) {
  if (!host || !view || !Number.isFinite(view.k) || view.k <= 0) return;

  const apply = () => applyView(host, view);

  apply();
  queueMicrotask(apply);
  let frames = 0;
  const tick = () => {
    apply();
    if (++frames < 40) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  for (const ms of [0, 32, 80, 160, 280, 420, 560, 720, 900]) {
    window.setTimeout(apply, ms);
  }
}

/**
 * Выполнить обновление plan, не давая редактору сделать fit().
 * Замораживает view: fitBounds и анимированный setView игнорируются.
 */
export function runWithoutCameraFit(
  host: HTMLElement | null,
  run: () => void,
): void {
  const view = captureEditorView(host);
  const pan = findEditorPan(host);
  if (pan) ensurePanWrapped(pan);

  if (view) {
    frozenView = view;
    if (freezeTimer) clearTimeout(freezeTimer);
    freezeTimer = setTimeout(() => {
      frozenView = null;
      freezeTimer = null;
      if (host && view) applyView(host, view);
    }, 900);
  }

  try {
    run();
  } finally {
    if (host && view) restoreEditorView(host, view);
  }
}
