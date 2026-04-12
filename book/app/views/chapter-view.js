export function renderChapterView({ chapter, onDismiss }) {
  const screen = document.createElement("main");
  screen.className = "screen chapter-screen";
  screen.setAttribute("aria-label", `Chapter ${chapter.id}`);

  const overlay = document.createElement("div");
  overlay.className = "chapter-overlay";
  overlay.addEventListener("click", () => onDismiss());
  screen.appendChild(overlay);

  const body = document.createElement("article");
  body.className = "chapter-body";
  body.setAttribute("aria-labelledby", `chapter-heading-${chapter.id}`);
  body.addEventListener("click", (event) => event.stopPropagation());

  const heading = document.createElement("h1");
  heading.id = `chapter-heading-${chapter.id}`;
  heading.className = "visually-hidden";
  heading.textContent = `${chapter.id} ${chapter.heading}`;
  body.appendChild(heading);

  const glyph = document.createElement("div");
  glyph.className = "chapter-glyph";
  glyph.setAttribute("aria-hidden", "true");
  glyph.textContent = chapter.glyph;
  body.appendChild(glyph);

  const lines = document.createElement("div");
  lines.className = "chapter-lines";

  for (const line of chapter.lines) {
    const paragraph = document.createElement("p");
    paragraph.className = "chapter-line";
    paragraph.textContent = line;
    lines.appendChild(paragraph);
  }

  body.appendChild(lines);
  screen.appendChild(body);

  return {
    node: screen,
    destroy() {},
  };
}
