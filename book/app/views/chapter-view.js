function stripPunctuationForDisplay(text) {
  return text.replace(/[\p{P}\p{S}]/gu, "");
}

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

  const table = document.createElement("table");
  table.className = "chapter-lines-table";

  const bodyGroup = document.createElement("tbody");

  for (const line of chapter.lines) {
    const row = document.createElement("tr");
    row.className = "chapter-line-row";

    const cell = document.createElement("td");
    cell.className = "chapter-line-cell";
    cell.textContent = stripPunctuationForDisplay(line);

    row.appendChild(cell);
    bodyGroup.appendChild(row);
  }

  table.appendChild(bodyGroup);
  body.appendChild(table);
  screen.appendChild(body);

  return {
    node: screen,
    destroy() {},
  };
}
