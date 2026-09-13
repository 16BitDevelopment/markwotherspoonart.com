/* Render the works grid.

   Layout is CSS Grid with JS-computed row spans, not CSS columns. Columns
   would order items top-to-bottom within each column, which breaks both
   reading order and tab order. Row spans keep DOM order and visual order
   identical while still letting every painting keep its true aspect ratio.

   Measurement runs in two passes: first with natural row heights so each
   tile reports its real height, then with 1px auto-rows and a computed
   span. Tiles carry intrinsic width/height, so the measurement is valid
   before any image has loaded. */

import { altText } from "./data.js";

const ROW = 1;        // grid-auto-rows, px
const STAGGER = 18;   // ms between tile fade-ins
const STAGGER_CAP = 12;

let gridEl = null;
let tiles = [];
let onOpen = () => {};

function gutter() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--gutter");
  return parseInt(v, 10) || 24;
}

function tileMarkup(work, index) {
  const li = document.createElement("li");
  li.className = "tile";
  li.dataset.category = work.category;
  li.dataset.id = work.id;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "tile-btn";
  btn.setAttribute("aria-haspopup", "dialog");

  const img = document.createElement("img");
  img.src = work.thumb;
  img.alt = altText(work);
  img.width = work.width;
  img.height = work.height;
  img.decoding = "async";
  // The first row is eager so the top of the page paints straight away.
  img.loading = index < 4 ? "eager" : "lazy";

  const cap = document.createElement("span");
  cap.className = "tile-cap";
  const t = document.createElement("span");
  t.className = "t";
  t.textContent = work.title;
  const c = document.createElement("span");
  c.className = "c";
  c.textContent = work.category;
  cap.append(t, c);

  btn.append(img, cap);
  btn.addEventListener("click", () => onOpen(work.id));

  // Activate explicitly rather than relying on the button's default
  // key handling. preventDefault stops the browser also synthesising a
  // click, so a painting opens exactly once. Enter fires on keydown and
  // Space on keyup, matching native button semantics.
  btn.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); onOpen(work.id); }
    else if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); }
  });
  btn.addEventListener("keyup", (e) => {
    if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); onOpen(work.id); }
  });

  li.append(btn);

  // Fade in once the bitmap is actually ready, staggered by position.
  // The tile is visible by default; this only adds a class, so a headless
  // renderer or a hidden tab still shows the image.
  const reveal = () => {
    const delay = Math.min(index, STAGGER_CAP) * STAGGER;
    setTimeout(() => img.classList.add("is-in"), delay);
  };
  if (img.complete) reveal();
  else {
    img.addEventListener("load", reveal, { once: true });
    img.addEventListener("error", () => img.classList.add("is-in"), { once: true });
  }

  return li;
}

/* Two-pass span calculation. Without `is-spanned` the grid uses natural
   row heights, so offsetHeight is each tile's true height. */
export function layout() {
  if (!gridEl) return;
  const visible = tiles.filter((li) => !li.hidden);
  if (!visible.length) return;

  gridEl.classList.remove("is-spanned");
  visible.forEach((li) => (li.style.gridRowEnd = ""));

  const g = gutter();
  const heights = visible.map((li) => li.offsetHeight);

  gridEl.classList.add("is-spanned");
  visible.forEach((li, i) => {
    const span = Math.max(1, Math.ceil((heights[i] + g) / ROW));
    li.style.gridRowEnd = `span ${span}`;
  });
}

export function render(works, el, openHandler) {
  gridEl = el;
  onOpen = openHandler;
  el.textContent = "";

  const frag = document.createDocumentFragment();
  tiles = works.map((w, i) => {
    const li = tileMarkup(w, i);
    frag.append(li);
    return li;
  });
  el.append(frag);

  layout();
  return tiles;
}

export function getTiles() {
  return tiles;
}

/* Relayout on resize, and once more after load in case a late web font or
   image nudges a caption onto a second line. */
export function watchLayout() {
  let raf = 0;
  const relayout = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(layout);
  };
  window.addEventListener("resize", relayout, { passive: true });
  window.addEventListener("load", relayout, { once: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
}
