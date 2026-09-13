/* Load and validate the works manifest. */

const REQUIRED = ["id", "title", "category", "src", "thumb", "width", "height"];

export async function loadWorks(url = "data/works.json") {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

  const raw = await res.json();
  if (!Array.isArray(raw)) throw new Error("works.json is not an array");

  const works = raw.filter((w) => {
    const ok = w && REQUIRED.every((k) => w[k] !== undefined && w[k] !== "");
    if (!ok) console.warn("skipping malformed work", w);
    return ok;
  });

  if (!works.length) throw new Error("works.json contained no usable entries");
  return works;
}

/* Title, then medium, then dimensions — omitting whatever is unknown.
   Nothing here invents a value. */
export function metaLine(work) {
  return [work.medium, work.dimensions].filter(Boolean).join(", ");
}

export function altText(work) {
  const kind = { landscape: "Landscape", portrait: "Portrait", figure: "Figure" };
  return `${work.title} — ${kind[work.category] || "Painting"} by Mark Wotherspoon`;
}
