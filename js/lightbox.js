/* Native <dialog> viewer.

   Traverses only the works matching the active filter. Escape closes,
   arrows move, focus is trapped by the dialog itself and restored to the
   originating tile on close. */

import { metaLine, altText } from "./data.js";

let dlg, imgEl, titleEl, metaEl, descEl, posEl;
let byId = new Map();
let order = [];
let index = 0;
let opener = null;

function paint() {
  const work = byId.get(order[index]);
  if (!work) return;

  imgEl.src = work.src;
  imgEl.alt = altText(work);
  imgEl.width = work.width;
  imgEl.height = work.height;

  titleEl.textContent = work.title;
  metaEl.textContent = metaLine(work);
  descEl.textContent = work.description || "";
  posEl.textContent = `${index + 1} / ${order.length}`;
  dlg.setAttribute("aria-label", `${work.title} — painting viewer`);
}

function step(delta) {
  if (order.length < 2) return;
  index = (index + delta + order.length) % order.length;
  paint();
}

export function initLightbox({ works, getOrder }) {
  byId = new Map(works.map((w) => [w.id, w]));

  dlg = document.getElementById("lightbox");
  imgEl = document.getElementById("lb-image");
  titleEl = document.getElementById("lb-title");
  metaEl = document.getElementById("lb-meta");
  descEl = document.getElementById("lb-desc");
  posEl = document.getElementById("lb-position");

  document.getElementById("lb-close").addEventListener("click", () => dlg.close());
  document.getElementById("lb-prev").addEventListener("click", () => step(-1));
  document.getElementById("lb-next").addEventListener("click", () => step(1));

  dlg.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
  });

  // Clicking the surround closes; clicking the painting does not.
  dlg.addEventListener("click", (e) => {
    if (!e.target.closest(".lb-figure, .lb-nav, .lb-close")) dlg.close();
  });

  dlg.addEventListener("close", () => {
    document.body.style.overflow = "";
    if (opener && document.contains(opener)) opener.focus();
    opener = null;
  });

  return function open(id) {
    order = getOrder();
    index = Math.max(0, order.indexOf(id));
    opener = document.activeElement;
    paint();
    document.body.style.overflow = "hidden";
    dlg.showModal();
  };
}
