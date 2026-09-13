/* Category filtering. State lives here; the grid just relayouts. */

import { layout, getTiles } from "./grid.js";

let current = "all";
let onChange = () => {};

export function activeCategory() {
  return current;
}

/* Ids currently on screen, in visual order — the lightbox traverses this,
   not the whole collection. */
export function visibleIds() {
  return getTiles().filter((li) => !li.hidden).map((li) => li.dataset.id);
}

function apply(category, countEl, gridEl) {
  current = category;
  const tiles = getTiles();
  let shown = 0;

  tiles.forEach((li) => {
    const match = category === "all" || li.dataset.category === category;
    li.hidden = !match;
    if (match) shown += 1;
  });

  layout();

  const noun = shown === 1 ? "painting" : "paintings";
  const where = category === "all" ? "" : ` in ${category}`;
  countEl.textContent = `${shown} ${noun}${where}`;

  gridEl.classList.remove("is-fading");
  onChange();
}

export function initFilters({ buttons, countEl, gridEl, onFiltered }) {
  onChange = onFiltered || (() => {});

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const category = btn.dataset.category;
      if (category === current) return;

      buttons.forEach((b) =>
        b.setAttribute("aria-pressed", String(b === btn))
      );

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        apply(category, countEl, gridEl);
        return;
      }

      gridEl.classList.add("is-fading");
      setTimeout(() => apply(category, countEl, gridEl), 140);
    });
  });

  apply("all", countEl, gridEl);
}
