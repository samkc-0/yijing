import { chapterFiles } from "../data/chapter-files.js";

const KING_WEN_BASE = 0x4dc0;
const chapterCache = new Map();

function parseHeading(entry = "") {
  const [name = entry] = entry.split("：");
  return name.trim();
}

export function listChapters() {
  return Object.entries(chapterFiles)
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([id, file]) => ({
      id,
      file,
      glyph: String.fromCodePoint(KING_WEN_BASE + Number(id) - 1),
    }));
}

export async function loadChapter(id) {
  if (!chapterFiles[id]) {
    throw new Error(`Unknown chapter: ${id}`);
  }

  if (!chapterCache.has(id)) {
    const chapterPromise = fetch(`/data/${chapterFiles[id]}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load chapter ${id}`);
        }

        return response.json();
      })
      .then((entries) => ({
        id,
        glyph: String.fromCodePoint(KING_WEN_BASE + Number(id) - 1),
        heading: parseHeading(entries[0]),
        judgment: entries[0] ?? "",
        lines: entries.slice(1, 7),
        entries,
      }));

    chapterCache.set(id, chapterPromise);
  }

  return chapterCache.get(id);
}
