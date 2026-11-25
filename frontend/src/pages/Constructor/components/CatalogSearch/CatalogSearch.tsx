import { useEffect, useMemo, useRef, type RefObject } from "react";
import {
  furnitureCatalogRu,
  officePackRu,
} from "../../floorplan/catalogRu";
import "./catalogSearch.css";

type Props = {
  hostRef: RefObject<HTMLElement | null>;
  enabled?: boolean;
};

type CatalogEntry = {
  /** Уникальный ключ в объединённом списке */
  uid: string;
  /** id кнопки в родном каталоге редактора */
  catalogId: string;
  kind: string;
  label: string;
  category: string;
  source: "office" | "furniture";
};

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildAllItems(): CatalogEntry[] {
  const out: CatalogEntry[] = [];
  const seen = new Set<string>();

  for (const item of officePackRu.items) {
    const kind = String(item.kind);
    const catalogId = kind; // в паке id === kind
    const uid = `office:${catalogId}`;
    if (seen.has(uid)) continue;
    seen.add(uid);
    out.push({
      uid,
      catalogId,
      kind,
      label: item.label,
      category: item.category,
      source: "office",
    });
  }

  for (const item of furnitureCatalogRu) {
    const kind = String(item.kind);
    const catalogId = String(item.id || kind);
    const uid = `furniture:${catalogId}`;
    if (seen.has(uid)) continue;
    seen.add(uid);
    out.push({
      uid,
      catalogId,
      kind,
      label: item.label,
      category: item.category,
      source: "furniture",
    });
  }

  return out.sort((a, b) => a.label.localeCompare(b.label, "ru"));
}

/**
 * Поиск сразу по двум каталогам: «Офис» (пак) и «Мебель» (базовый).
 * Вставляется в `.fp-catalog` редактора.
 */
function CatalogSearch({ hostRef, enabled = true }: Props) {
  const allItems = useMemo(() => buildAllItems(), []);
  const itemsRef = useRef(allItems);
  itemsRef.current = allItems;

  useEffect(() => {
    if (!enabled) return;

    let catalogEl: HTMLElement | null = null;
    let searchWrap: HTMLDivElement | null = null;
    let inputEl: HTMLInputElement | null = null;
    let resultsEl: HTMLDivElement | null = null;
    let emptyEl: HTMLParagraphElement | null = null;
    let hintEl: HTMLParagraphElement | null = null;
    let mo: MutationObserver | null = null;
    let pollId = 0;
    let query = "";

    const ensureUi = (catalog: HTMLElement) => {
      if (searchWrap && catalog.contains(searchWrap)) return;

      searchWrap = document.createElement("div");
      searchWrap.className = "os-catalog-search";

      inputEl = document.createElement("input");
      inputEl.type = "search";
      inputEl.className = "os-catalog-search-input";
      inputEl.placeholder = "Поиск по офису и мебели…";
      inputEl.autocomplete = "off";
      inputEl.spellcheck = false;
      inputEl.value = query;

      hintEl = document.createElement("p");
      hintEl.className = "os-catalog-search-hint";
      hintEl.textContent = `Всего ${itemsRef.current.length} элементов · Офис + Мебель`;

      resultsEl = document.createElement("div");
      resultsEl.className = "os-catalog-search-results";
      resultsEl.hidden = true;

      emptyEl = document.createElement("p");
      emptyEl.className = "os-catalog-search-empty";
      emptyEl.hidden = true;
      emptyEl.textContent = "Ничего не найдено";

      searchWrap.append(inputEl, hintEl, resultsEl, emptyEl);

      const title = catalog.querySelector(".fp-panel-title");
      if (title?.nextSibling) {
        catalog.insertBefore(searchWrap, title.nextSibling);
      } else {
        catalog.prepend(searchWrap);
      }

      inputEl.addEventListener("pointerdown", (e) => e.stopPropagation());
      inputEl.addEventListener("keydown", (e) => e.stopPropagation());
      inputEl.addEventListener("input", () => {
        query = inputEl?.value || "";
        renderResults();
      });
    };

    const hideNative = (catalog: HTMLElement, hide: boolean) => {
      catalog.classList.toggle("os-catalog-searching", hide);
    };

    const clickDockForSource = (source: CatalogEntry["source"]) => {
      const host = hostRef.current;
      const dock = host?.querySelector(".fp-dock") as HTMLElement | null;
      if (!dock) return;

      const buttons = Array.from(
        dock.querySelectorAll<HTMLButtonElement>(":scope > .fp-tool-btn"),
      );

      if (source === "office") {
        const packLabel = officePackRu.label; // «Офис»
        const packName = officePackRu.name; // «office»
        const packBtn = buttons.find((btn) => {
          const tip = btn.getAttribute("data-tip") || "";
          const tipLow = tip.toLowerCase();
          return (
            tip.startsWith(packLabel) ||
            tip.includes(packLabel) ||
            tipLow.includes("office ·") ||
            tipLow.startsWith("office") ||
            tipLow.includes(`· ${String(officePackRu.key || "o").toLowerCase()}`)
          );
        });
        // запасной: любая pack-кнопка с SVG path (не стандартные инструменты)
        (packBtn ||
          buttons.find((b) => {
            const tip = (b.getAttribute("data-tip") || "").toLowerCase();
            return tip.includes("офис") || tip.includes(packName);
          }))?.click();
        return;
      }

      // Базовая мебель — кнопка «Мебель · F»
      const furnBtn = buttons.find((btn) => {
        const tip = (btn.getAttribute("data-tip") || "").toLowerCase();
        return (
          tip.includes("мебель") ||
          tip.includes("furniture") ||
          /\b·\s*f\b/.test(tip)
        );
      });
      furnBtn?.click();
    };

    const activateItem = (entry: CatalogEntry) => {
      const host = hostRef.current;
      if (!host) return;

      // Не сбрасываем строку поиска до успешного выбора — иначе Vue
      // перерисует каталог и потеряется контекст.
      clickDockForSource(entry.source);

      const trySelect = (attempt: number) => {
        const catalog = host.querySelector(".fp-catalog") as HTMLElement | null;
        if (!catalog) {
          if (attempt < 12) window.setTimeout(() => trySelect(attempt + 1), 40);
          return;
        }
        ensureUi(catalog);

        // Пока ищем кнопку — временно показать родную сетку (нужны чипы/элементы)
        hideNative(catalog, false);

        const chips = Array.from(
          catalog.querySelectorAll<HTMLButtonElement>(".fp-chip"),
        );
        const chip = chips.find(
          (c) => normalize(c.textContent || "") === normalize(entry.category),
        );
        chip?.click();

        window.setTimeout(() => {
          const items = Array.from(
            catalog.querySelectorAll<HTMLButtonElement>(".fp-catalog-item"),
          );
          const labelNorm = normalize(entry.label);
          const match =
            items.find(
              (btn) =>
                normalize(btn.querySelector("span")?.textContent || "") ===
                labelNorm,
            ) ||
            items.find((btn) =>
              normalize(btn.querySelector("span")?.textContent || "").includes(
                labelNorm,
              ),
            );

          if (!match) {
            if (attempt < 12) {
              window.setTimeout(() => trySelect(attempt + 1), 50);
              return;
            }
            // вернуть результаты поиска
            renderResults();
            return;
          }

          match.click();
          query = "";
          if (inputEl) inputEl.value = "";
          renderResults();
        }, 40);
      };

      window.setTimeout(() => trySelect(0), 40);
    };

    const appendSection = (
      parent: HTMLElement,
      title: string,
      entries: CatalogEntry[],
    ) => {
      if (!entries.length) return;
      const head = document.createElement("div");
      head.className = "os-catalog-search-section";
      head.textContent = `${title} · ${entries.length}`;
      parent.append(head);

      for (const item of entries) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "os-catalog-search-item";
        btn.title = `${item.label} · ${item.category}`;

        const row = document.createElement("div");
        row.className = "os-catalog-search-item-row";

        const name = document.createElement("span");
        name.className = "os-catalog-search-item-label";
        name.textContent = item.label;

        const badge = document.createElement("span");
        badge.className = `os-catalog-search-badge os-catalog-search-badge--${item.source}`;
        badge.textContent = item.source === "office" ? "Офис" : "Мебель";

        row.append(name, badge);

        const cat = document.createElement("span");
        cat.className = "os-catalog-search-item-cat";
        cat.textContent = item.category;

        btn.append(row, cat);
        btn.addEventListener("pointerdown", (e) => e.stopPropagation());
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          activateItem(item);
        });
        parent.append(btn);
      }
    };

    const renderResults = () => {
      const catalog =
        catalogEl ||
        (hostRef.current?.querySelector(".fp-catalog") as HTMLElement | null);
      if (!catalog || !resultsEl || !emptyEl || !inputEl) return;

      const q = normalize(query);
      if (hintEl) {
        hintEl.hidden = Boolean(q);
      }

      if (!q) {
        hideNative(catalog, false);
        resultsEl.hidden = true;
        emptyEl.hidden = true;
        resultsEl.replaceChildren();
        return;
      }

      hideNative(catalog, true);
      const matched = itemsRef.current.filter((item) => {
        const hay = normalize(
          `${item.label} ${item.category} ${item.kind} ${item.source === "office" ? "офис" : "мебель"}`,
        );
        return hay.includes(q);
      });

      resultsEl.replaceChildren();
      if (!matched.length) {
        resultsEl.hidden = true;
        emptyEl.hidden = false;
        return;
      }

      emptyEl.hidden = true;
      resultsEl.hidden = false;

      const officeHits = matched.filter((m) => m.source === "office");
      const furnitureHits = matched.filter((m) => m.source === "furniture");

      appendSection(resultsEl, "Офис", officeHits.slice(0, 60));
      appendSection(resultsEl, "Мебель", furnitureHits.slice(0, 40));
    };

    const attach = () => {
      const host = hostRef.current;
      if (!host) return;
      const catalog = host.querySelector(".fp-catalog") as HTMLElement | null;
      if (!catalog) {
        catalogEl = null;
        return;
      }
      if (catalog === catalogEl && searchWrap && catalog.contains(searchWrap)) {
        return;
      }
      catalogEl = catalog;
      ensureUi(catalog);
      renderResults();
    };

    attach();
    pollId = window.setInterval(attach, 400);
    mo = new MutationObserver(() => attach());
    if (hostRef.current) {
      mo.observe(hostRef.current, { childList: true, subtree: true });
    }

    return () => {
      window.clearInterval(pollId);
      mo?.disconnect();
      searchWrap?.remove();
      searchWrap = null;
      inputEl = null;
      resultsEl = null;
      emptyEl = null;
      hintEl = null;
      catalogEl = null;
    };
  }, [enabled, hostRef]);

  return null;
}

export default CatalogSearch;
