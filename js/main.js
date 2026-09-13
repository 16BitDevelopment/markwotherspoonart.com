/* Wire the gallery together. */

import { loadWorks } from "./data.js";
import { render, watchLayout } from "./grid.js";
import { initFilters, visibleIds } from "./filter.js";
import { initLightbox } from "./lightbox.js";
import { preloadThumbs } from "./preload.js";

const gridEl = document.getElementById("works");
const countEl = document.getElementById("count");
const feedbackEl = document.getElementById("feedback");

function fail(err) {
  console.error(err);
  gridEl.hidden = true;
  countEl.textContent = "";
  feedbackEl.hidden = false;
  feedbackEl.innerHTML =
    'The paintings could not be loaded. If you are opening this file directly ' +
    'from disk, it needs to be served over http. In the meantime the work is on ' +
    '<a href="https://www.instagram.com/mark_wotherspoon_art/">Instagram</a>, ' +
    'or email <a href="mailto:mwothe011@gmail.com">mwothe011@gmail.com</a>.';
}

async function start() {
  let works;
  try {
    works = await loadWorks();
  } catch (err) {
    fail(err);
    return;
  }

  const open = initLightbox({ works, getOrder: visibleIds });
  render(works, gridEl, open);
  initFilters({
    buttons: Array.from(document.querySelectorAll(".filter")),
    countEl,
    gridEl,
  });
  watchLayout();

  // Warm the rest of the thumbnails once the page has settled, so switching
  // category renders from cache instead of empty frames. The About
  // photograph goes first: it is a real image on the page and must not sit
  // behind 111 speculative fetches.
  const about = document.querySelector(".about-figure img");
  window.__preload = preloadThumbs([
    about && about.getAttribute("src"),
    ...works.map((w) => w.thumb),
  ]);
}

start();
