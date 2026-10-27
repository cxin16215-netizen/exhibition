const colors = ["#e25a3c", "#3d8ec9", "#5ea36a", "#e2c14a", "#8b6fd4", "#3cb8b4"];
const board = document.createElement("div");
board.className = "board";
board.id = "board";
document.body.prepend(board);

const cellSize = window.matchMedia("(max-width: 720px)").matches ? 42 : 64;
const cols = Math.max(6, Math.ceil(window.innerWidth / cellSize));
const rows = Math.max(8, Math.ceil(window.innerHeight / cellSize));
board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

const cells = [];
for (let y = 0; y < rows; y += 1) {
  for (let x = 0; x < cols; x += 1) {
    const cell = document.createElement("i");
    cell.className = "cell";
    cell.dataset.x = String(x);
    cell.dataset.y = String(y);
    board.appendChild(cell);
    cells.push(cell);
  }
}

const at = (x, y) => {
  if (x < 0 || y < 0 || x >= cols || y >= rows) return undefined;
  return cells[y * cols + x];
};

function paint(cell, color) {
  cell.dataset.color = color;
  cell.style.setProperty("--c", color);
  cell.classList.add("is-lit");
}

function clearCell(cell) {
  cell.classList.remove("is-lit");
  delete cell.dataset.color;
  cell.style.removeProperty("--c");
}

[
  [2, 2], [3, 2], [4, 2],
  [cols - 4, 4], [cols - 3, 4],
  [1, rows - 3], [2, rows - 3], [2, rows - 4],
].forEach(([x, y], index) => {
  const cell = at(x, y);
  if (cell) paint(cell, colors[index % colors.length]);
});

let drawing = false;
let stroke = colors[0];
let strokeIndex = 0;

function groupOf(start) {
  const color = start.dataset.color;
  if (!color) return [];
  const seen = new Set();
  const stack = [start];
  while (stack.length) {
    const cell = stack.pop();
    if (!cell || seen.has(cell) || cell.dataset.color !== color) continue;
    seen.add(cell);
    const x = Number(cell.dataset.x);
    const y = Number(cell.dataset.y);
    stack.push(at(x + 1, y), at(x - 1, y), at(x, y + 1), at(x, y - 1));
  }
  return [...seen];
}

function spill(color) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const veil = document.createElement("div");
  veil.className = "veil";
  veil.style.background = color;
  document.body.appendChild(veil);
  window.setTimeout(() => veil.remove(), 1100);
}

function resolve(from) {
  const grouped = groupOf(from);
  if (grouped.length < 3) return;
  const color = from.dataset.color;
  grouped.forEach(clearCell);
  spill(color);
}

board.addEventListener("pointerdown", (event) => {
  const cell = event.target.closest(".cell");
  if (!cell || !board.contains(cell)) return;
  drawing = true;
  strokeIndex = (strokeIndex + 1) % colors.length;
  stroke = colors[strokeIndex];
  paint(cell, stroke);
  board.setPointerCapture(event.pointerId);
});

board.addEventListener("pointermove", (event) => {
  if (!drawing) return;
  const hit = document.elementFromPoint(event.clientX, event.clientY);
  const cell = hit && hit.closest && hit.closest(".cell");
  if (!cell || !board.contains(cell) || cell.dataset.color) return;
  paint(cell, stroke);
});

function finishStroke() {
  if (!drawing) return;
  drawing = false;
  cells.forEach((cell) => {
    if (cell.dataset.color === stroke) resolve(cell);
  });
}

board.addEventListener("pointerup", finishStroke);
board.addEventListener("pointercancel", () => {
  drawing = false;
});

const jobs = document.querySelector(".in-page");
if (jobs) {
  const tabs = [...jobs.querySelectorAll("a")];
  const panels = tabs.map((tab) => document.querySelector(tab.getAttribute("href")));
  const show = (id) => {
    tabs.forEach((tab) => {
      if (tab.getAttribute("href") === "#" + id) tab.setAttribute("aria-current", "true");
      else tab.removeAttribute("aria-current");
    });
    panels.forEach((panel) => {
      if (panel) panel.hidden = panel.id !== id;
    });
  };
  jobs.addEventListener("click", (event) => {
    const tab = event.target.closest("a");
    if (!tab || !jobs.contains(tab)) return;
    event.preventDefault();
    const id = tab.getAttribute("href").slice(1);
    history.replaceState(null, "", "#" + id);
    show(id);
    const top = jobs.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo(0, Math.max(0, top));
  });
  const id = location.hash.replace("#", "");
  if (panels.some((panel) => panel && panel.id === id)) show(id);
}
