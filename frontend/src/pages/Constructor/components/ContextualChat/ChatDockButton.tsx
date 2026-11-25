import { useEffect, useRef, type RefObject } from "react";

type Props = {
  active: boolean;
  disabled?: boolean;
  hostRef: RefObject<HTMLElement | null>;
  onClick: () => void;
  onNativeToolClick?: () => void;
};

const CHAT_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-3.5 3v-3H7.5A2.5 2.5 0 0 1 5 12.5v-6z" stroke-linejoin="round"/><path d="M8.5 8.5h7M8.5 11.5h4.5" stroke-linecap="round"/></svg>`;

/**
 * Вставляет «Чат» в штатный `.fp-dock` через DOM (не React portal),
 * чтобы не конфликтовать с Vue-рендером редактора.
 */
function ChatDockButton({
  active,
  disabled,
  hostRef,
  onClick,
  onNativeToolClick,
}: Props) {
  const onClickRef = useRef(onClick);
  const onNativeRef = useRef(onNativeToolClick);
  const activeRef = useRef(active);
  const disabledRef = useRef(disabled);
  onClickRef.current = onClick;
  onNativeRef.current = onNativeToolClick;
  activeRef.current = active;
  disabledRef.current = disabled;

  const nodesRef = useRef<{
    sep: HTMLDivElement;
    btn: HTMLButtonElement;
  } | null>(null);

  useEffect(() => {
    const sep = document.createElement("div");
    sep.className = "fp-dock-sep os-chat-dock-sep";
    sep.setAttribute("aria-hidden", "true");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fp-tool-btn os-chat-tool-btn";
    btn.setAttribute("aria-label", "Чат");
    btn.innerHTML = CHAT_SVG;
    nodesRef.current = { sep, btn };

    const syncBtn = () => {
      const isActive = activeRef.current;
      const isDisabled = Boolean(disabledRef.current);
      btn.classList.toggle("active", isActive);
      btn.classList.toggle("os-chat-tool-active", isActive);
      btn.disabled = isDisabled;
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      btn.setAttribute(
        "data-tip",
        isDisabled ? "Ollama недоступна" : "Чат",
      );
    };
    syncBtn();

    const onBtnClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onClickRef.current();
    };
    btn.addEventListener("click", onBtnClick);

    const onDockPointer = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.(
        ".fp-tool-btn",
      ) as HTMLElement | null;
      if (!target || target.classList.contains("os-chat-tool-btn")) return;
      onNativeRef.current?.();
    };

    let dockEl: HTMLElement | null = null;
    let mo: MutationObserver | null = null;
    let cancelled = false;

    const place = (dock: HTMLElement) => {
      if (cancelled) return;
      if (btn.isConnected && sep.isConnected && dock.contains(btn)) return;
      // перед блоком Undo/Redo (первый sep) или в конец
      const firstSep = Array.from(dock.querySelectorAll(":scope > .fp-dock-sep")).find(
        (el) => !el.classList.contains("os-chat-dock-sep"),
      );
      if (firstSep) {
        dock.insertBefore(sep, firstSep);
        dock.insertBefore(btn, firstSep);
      } else {
        dock.appendChild(sep);
        dock.appendChild(btn);
      }
      syncBtn();
    };

    const bind = (dock: HTMLElement) => {
      if (dockEl && dockEl !== dock) {
        dockEl.removeEventListener("pointerdown", onDockPointer);
      }
      dockEl = dock;
      dock.addEventListener("pointerdown", onDockPointer);
      place(dock);
      mo?.disconnect();
      mo = new MutationObserver(() => {
        if (!dock.contains(btn)) place(dock);
      });
      mo.observe(dock, { childList: true });
    };

    const tryAttach = () => {
      const host = hostRef.current;
      if (!host || cancelled) return false;
      const dock = host.querySelector(".fp-dock") as HTMLElement | null;
      if (!dock) return false;
      bind(dock);
      return true;
    };

    let poll = 0;
    if (!tryAttach()) {
      poll = window.setInterval(() => {
        if (tryAttach()) window.clearInterval(poll);
      }, 100);
    }

    // если Vue пересоздал весь root — ищем dock заново
    const hostMo = new MutationObserver(() => {
      const host = hostRef.current;
      const dock = host?.querySelector(".fp-dock") as HTMLElement | null;
      if (dock && dock !== dockEl) bind(dock);
    });
    if (hostRef.current) {
      hostMo.observe(hostRef.current, { childList: true, subtree: true });
    }

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      mo?.disconnect();
      hostMo.disconnect();
      dockEl?.removeEventListener("pointerdown", onDockPointer);
      btn.removeEventListener("click", onBtnClick);
      sep.remove();
      btn.remove();
      nodesRef.current = null;
    };
  }, [hostRef]);

  useEffect(() => {
    const btn = nodesRef.current?.btn;
    if (!btn) return;
    btn.classList.toggle("active", active);
    btn.classList.toggle("os-chat-tool-active", active);
    btn.disabled = Boolean(disabled);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
    btn.setAttribute(
      "data-tip",
      disabled ? "Ollama недоступна" : "Чат",
    );
    if (active) {
      const dock = btn.parentElement;
      dock
        ?.querySelectorAll(".fp-tool-btn:not(.os-chat-tool-btn).active")
        .forEach((el) => el.classList.remove("active"));
    }
  }, [active, disabled]);

  return null;
}

export default ChatDockButton;
