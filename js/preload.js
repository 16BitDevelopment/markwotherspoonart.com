/* Warm the thumbnail cache in the background.

   A tile hidden by the filter is display:none, so its lazy <img> never
   intersects the viewport and never fetches. The first switch to a category
   therefore shows empty frames while those thumbnails arrive. Warming the
   HTTP cache after first paint means a later filter switch renders from
   cache instead.

   This deliberately trades bandwidth for responsiveness, so it backs off on
   metered or slow connections, and it never competes with the initial
   render: it starts after load, runs a few at a time at low priority, and
   yields to idle between each one. */

const CONCURRENCY = 3;
const IDLE_TIMEOUT = 1000;

function allowed() {
  const c = navigator.connection;
  if (!c) return true;
  if (c.saveData) return false;
  return !/(^|-)2g$/.test(c.effectiveType || "");
}

function idle() {
  return new Promise((resolve) => {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => resolve(), { timeout: IDLE_TIMEOUT });
    } else {
      setTimeout(resolve, 200);
    }
  });
}

function fetchOne(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.fetchPriority = "low";
    img.decoding = "async";
    img.onload = img.onerror = () => resolve();
    img.src = url;
  });
}

async function worker(queue, state) {
  while (queue.length && !state.stopped) {
    await fetchOne(queue.shift());
    state.done += 1;
    await idle();
  }
}

/* Takes URLs in priority order — anything the page itself still needs should
   come first, so the preloader never outranks a real image.
   Returns a handle so the caller can stop it or check progress. */
export function preloadThumbs(urls) {
  const state = { done: 0, total: 0, stopped: false, skipped: false };

  if (!allowed()) {
    state.skipped = true;
    return state;
  }

  const start = () => {
    const queue = [...new Set(urls)].filter(Boolean);
    state.total = queue.length;
    const workers = Array.from({ length: CONCURRENCY }, () => worker(queue, state));
    Promise.all(workers).then(() => { state.finished = true; });
  };

  if (document.readyState === "complete") idle().then(start);
  else window.addEventListener("load", () => idle().then(start), { once: true });

  return state;
}
