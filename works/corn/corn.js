const field = document.getElementById("field");
const canvas = document.getElementById("wash");
const notch = document.getElementById("notch");
const line = document.getElementById("line");
const phrases = ["把种子留下来", "种子与地方", "玉米带", "田野女王"];
const chapterNumbers = ["第一章", "第二章", "第三章", "第四章"];
const coverLabel = document.querySelector(".words .kicker");
const signs = [...document.querySelectorAll(".signs img")];
let shown = 0;
const ctx = canvas.getContext("2d");

const keys = [
  { sky: "#e9d9ae", deep: "#c4894a", land: "#8fa56b", far: "#b77c50", accent: "#74583e", flat: 0 },
  { sky: "#d5e0e4", deep: "#9aabaf", land: "#c6b08a", far: "#869aa4", accent: "#637784", flat: 0.35 },
  { sky: "#efe6d2", deep: "#d7c7a4", land: "#a76e54", far: "#5d765c", accent: "#46547b", flat: 0.7 },
  { sky: "#d5dee4", deep: "#aabbc5", land: "#8a9aa3", far: "#4f6457", accent: "#a34f43", flat: 1 },
];

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const mix = (a, b, u) => {
  const A = rgb(a);
  const B = rgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(",")})`;
};

const sample = (t) => {
  const x = Math.min(0.9999, Math.max(0, t)) * (keys.length - 1);
  const i = Math.floor(x);
  const u = x - i;
  const A = keys[i];
  const B = keys[i + 1];
  const out = {};
  for (const key of Object.keys(A)) out[key] = typeof A[key] === "number" ? A[key] + (B[key] - A[key]) * u : mix(A[key], B[key], u);
  return out;
};

let t = 0;
let pointerY = 0.42;
let pointerX = 0.5;
let width = 1;
let height = 1;
let noise = null;
let dragging = false;
let queued = false;

const resize = () => {
  // This is a soft painted backdrop; high-DPI blur adds cost without visible detail.
  const ratio = Math.min(1, window.devicePixelRatio || 1);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  noise = document.createElement("canvas");
  noise.width = 160;
  noise.height = 160;
  const nctx = noise.getContext("2d");
  const dots = nctx.createImageData(160, 160);
  for (let i = 0; i < dots.data.length; i += 4) {
    const v = 210 + Math.random() * 45;
    dots.data[i] = dots.data[i + 1] = dots.data[i + 2] = v;
    dots.data[i + 3] = 255;
  }
  nctx.putImageData(dots, 0, 0);
  poke();
};

const wave = (x, amp, seed) => Math.sin(x * 0.005 + seed) * amp + Math.sin(x * 0.011 + seed * 1.8) * amp * 0.4;

const softBand = (y, amp, color, seed) => {
  ctx.beginPath();
  ctx.moveTo(0, height + 80);
  ctx.lineTo(0, y + wave(0, amp, seed));
  for (let x = 0; x <= width; x += 14) ctx.lineTo(x, y + wave(x, amp, seed));
  ctx.lineTo(width, height + 80);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
};

const draw = () => {
  const look = sample(t);
  const amp = height * (0.085 * (1 - look.flat) + 0.006);
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, look.sky);
  sky.addColorStop(1, look.deep);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.filter = "blur(26px)";
  softBand(height * (0.3 + look.flat * 0.2), amp * 1.5, look.far, 0.6);
  softBand(height * (0.48 + look.flat * 0.14), amp, look.land, 1.8);
  ctx.globalAlpha = 0.28 * (1 - look.flat * 0.65);
  ctx.fillStyle = look.accent;
  ctx.beginPath();
  ctx.ellipse(width * 0.24, height * 0.5, width * 0.16, height * 0.1, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const glow = ctx.createRadialGradient(pointerX * width, pointerY * height, 0, pointerX * width, pointerY * height, width * 0.38);
  glow.addColorStop(0, look.accent);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 0.14;
  ctx.drawImage(noise, 0, 0, width, height);
  ctx.globalAlpha = 1;
};

const sync = () => {
  const stop = Math.round(t * (phrases.length - 1));
  field.setAttribute("aria-valuenow", String(stop + 1));
  field.setAttribute("aria-valuetext", `${chapterNumbers[stop]} · ${phrases[stop]}`);
  stopButtons.forEach((b, n) => b.classList.toggle("is-on", n === stop));
  notch.style.top = `calc(${t * 100}% - 1px)`;
  const x = Math.min(0.9999, t) * (signs.length - 1);
  const i = Math.floor(x);
  const u = x - i;
  signs.forEach((img, n) => {
    const on = n === i ? 1 - u : n === i + 1 ? u : 0;
    img.style.opacity = String(on);
    img.toggleAttribute("aria-hidden", on < 0.5);
  });
  const index = Math.round(t * (phrases.length - 1));
  if (index !== shown) {
    shown = index;
    line.textContent = phrases[index];
  }
  coverLabel.textContent = `穗序 · ${chapterNumbers[index]}`;
  if (typeof syncCover === "function") syncCover();
};

const poke = () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    draw();
    sync();
  });
};

const setT = (next) => {
  t = Math.min(1, Math.max(0, next));
  poke();
};

/* 滑动条固定四档：任何输入都吸附到最近的一章，并缓动过去 */
const STOPS = phrases.length - 1;
const COVER_KEY = "corn-cover";
let targetStop = 0;
let tween = 0;
const clampStop = (n) => Math.max(0, Math.min(STOPS, n));
const goTo = (n, instant = false) => {
  n = clampStop(n);
  targetStop = n;
  try { localStorage.setItem(COVER_KEY, String(n)); } catch {}
  cancelAnimationFrame(tween);
  const to = n / STOPS;
  if (instant || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setT(to); return; }
  const from = t;
  const dur = 380 + Math.abs(to - from) * STOPS * 140;
  const start = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - start) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    setT(from + (to - from) * e);
    if (k < 1) tween = requestAnimationFrame(step);
  };
  tween = requestAnimationFrame(step);
};
const railStop = (clientY) => {
  const box = document.querySelector(".pigment").getBoundingClientRect();
  return clampStop(Math.round(((clientY - box.top) / box.height) * STOPS));
};

/* 档位按钮：沿滑动条放四个可点的圆点 */
const stopRail = document.createElement("div");
stopRail.className = "stops";
stopRail.setAttribute("aria-hidden", "true");
const stopButtons = chapterNumbers.map((label, n) => {
  const b = document.createElement("button");
  b.type = "button";
  b.tabIndex = -1;
  b.style.top = `${(n / STOPS) * 100}%`;
  b.innerHTML = `<i></i><span>${label.replace("第", "").replace("章", "")}</span>`;
  b.title = `${label} · ${phrases[n]}`;
  b.addEventListener("click", (e) => { e.stopPropagation(); goTo(n); });
  stopRail.append(b);
  return b;
});
document.querySelector(".pigment").after(stopRail);

let wheelSum = 0;
let wheelLock = 0;
field.addEventListener("wheel", (event) => {
  event.preventDefault();
  if (open || busy) return;
  const now = performance.now();
  if (now < wheelLock) return;
  wheelSum += event.deltaY;
  if (Math.abs(wheelSum) >= 60) {
    goTo(targetStop + Math.sign(wheelSum));
    wheelSum = 0;
    wheelLock = now + 450;
  }
}, { passive: false });

field.addEventListener("pointerdown", (event) => {
  if (event.target.closest(".curl, .leafbox, .edge, .stops")) return;
  dragging = true;
  field.setPointerCapture(event.pointerId);
  pointerX = event.clientX / width;
  pointerY = event.clientY / height;
});

field.addEventListener("pointermove", (event) => {
  if (open || busy) return;
  pointerX = event.clientX / width;
  pointerY = event.clientY / height;
  if (dragging) {
    const n = railStop(event.clientY);
    if (n !== targetStop) goTo(n);
  }
});

const release = () => {
  dragging = false;
};
field.addEventListener("pointerup", release);
field.addEventListener("pointercancel", release);

field.addEventListener("keydown", (event) => {
  if (event.target.closest("a, input, textarea, select")) return;
  if (open) {
    if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Escape", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "Escape") { returnToStart(); return; }
      if (busy) return;
      if (event.key === "Home") turnTo(0, -1);
      else if (event.key === "End") turnTo(leaves.length - 1, 1);
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") foldTurn();
      else forward();
    }
    return;
  }
  if (["ArrowDown", "ArrowRight", "PageDown"].includes(event.key)) {
    event.preventDefault();
    goTo(targetStop + 1);
  } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(event.key)) {
    event.preventDefault();
    goTo(targetStop - 1);
  } else if (event.key === "Home") {
    event.preventDefault();
    goTo(0);
  } else if (event.key === "End") {
    event.preventDefault();
    goTo(STOPS);
  }
});

const chapters = new Map([...document.querySelectorAll("#chapters > div")].map((node) => [Number(node.dataset.cover), [...node.children]]));
const leafbox = document.getElementById("leafbox");
const sheet = document.getElementById("sheet");
const front = document.getElementById("front");
const back = document.getElementById("back");
const under = document.getElementById("under");
const dogear = document.getElementById("dogear");
const onward = document.getElementById("onward");
const fold = document.getElementById("fold");
const status = document.getElementById("status");
const closeBook = document.getElementById("close-book");
let chapter = 0;
let leaves = chapters.get(0) || [];
let page = 0;
let open = false;
let busy = false;
let turnAnimation = null;
let shadeAnimation = null;
let turnGeneration = 0;
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const pageViews = new Map();
const PAGE_KEY = "corn-pages";
let resume = {};
try { resume = JSON.parse(localStorage.getItem(PAGE_KEY) || "{}") || {}; } catch {}
const saveResume = () => { try { localStorage.setItem(PAGE_KEY, JSON.stringify(resume)); } catch {} };
const turnShade = document.createElement("div");
turnShade.className = "turn-shade";
turnShade.setAttribute("aria-hidden", "true");
sheet.append(turnShade);
const pageCounter = document.createElement("p");
pageCounter.className = "page-counter";
pageCounter.setAttribute("aria-hidden", "true");
leafbox.append(pageCounter);
const bookLabel = document.createElement("p");
bookLabel.className = "book-label";
leafbox.append(bookLabel);
under.classList.add("face");
under.setAttribute("aria-hidden", "true");
back.setAttribute("aria-hidden", "true");

function view(index) {
  const key = `${chapter}:${index}`;
  if (!leaves[index]) return [];
  if (!pageViews.has(key)) pageViews.set(key, [...leaves[index].childNodes].map(node => node.cloneNode(true)));
  return pageViews.get(key);
}

function warmPage(index) {
  const jobs = [];
  for (const node of view(index)) {
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    for (const img of node.querySelectorAll("img")) {
      img.loading = "eager";
      if (!img.complete) jobs.push(img.decode().catch(() => {}));
    }
  }
  return Promise.all(jobs);
}

function paint(node, index) {
  node.replaceChildren(...(index >= 0 ? view(index) : []));
  if (node === under) node.style.visibility = index >= 0 ? "visible" : "hidden";
}

function armCurls() {
  dogear.hidden = open || !(chapters.get(shown) || []).length;
  dogear.setAttribute("aria-label", shown === 3 ? "翻开第四章" : "翻开封面");
  onward.hidden = !open;
  onward.setAttribute("aria-label", page < leaves.length - 1 ? "下一页" : "读完，收起本章");
  dogear.dataset.hint = "翻开本章 ↗";
  onward.dataset.hint = page < leaves.length - 1 ? "下一页 →" : "收起本章 ↙";
  fold.setAttribute("aria-label", page > 0 ? "上一页" : "收起本章");
  pageCounter.textContent = open ? `${page + 1} / ${leaves.length}` : "";
  bookLabel.textContent = `${chapterNumbers[chapter]} · ${phrases[chapter]}`;
  if (status) status.textContent = open && leaves[page] ? `第${chapter + 1}章，第${page + 1}页，共${leaves.length}页。${leaves[page].textContent.replace(/\s+/g, " ")}` : "";
}

function buttons() {
  dogear.disabled = busy;
  onward.disabled = busy;
  fold.disabled = busy;
  armCurls();
}

function syncCover() {
  if (open && shown !== chapter) {
    shutCover();
  }
  armCurls();
}

function settle(nextPage) {
  stopTurn();
  page = nextPage;
  paint(front, page);
  paint(back, -1);
  paint(under, -1);
  sheet.classList.add("is-flat");
  busy = false;
  buttons();
  warmPage(page + 1);
  warmPage(page - 1);
}

function stopTurn() {
  turnGeneration++;
  turnAnimation?.cancel();
  shadeAnimation?.cancel();
  turnAnimation = shadeAnimation = null;
  sheet.style.transform = "";
  leafbox.classList.remove("is-turning");
}

function animateTurn(from, to, done, duration = 480) {
  if (motionPreference.matches || !sheet.animate) { done(); return; }
  const generation = ++turnGeneration;
  busy = true;
  buttons();
  leafbox.classList.add("is-turning");
  turnAnimation = sheet.animate([{ transform: from }, { transform: to }], {
    duration, easing: "cubic-bezier(.4,.08,.45,.94)", fill: "both"
  });
  shadeAnimation = turnShade.animate([{ opacity: 0 }, { opacity: .24, offset: .5 }, { opacity: .05 }], { duration, fill: "both" });
  turnAnimation.finished.then(() => { if (generation === turnGeneration) done(); }).catch(() => {});
}

function openCover() {
  const next = chapters.get(shown) || [];
  if (open || busy || !next.length) return;
  chapter = shown;
  leaves = next;
  open = true;
  const startPage = Math.min(Math.max(0, resume[chapter] | 0), leaves.length - 1);
  page = startPage;
  leafbox.hidden = false;
  paint(front, startPage);
  paint(back, -1);
  paint(under, -1);
  warmPage(startPage);
  warmPage(startPage + 1);
  animateTurn("rotateY(-85deg)", "rotateY(0deg)", () => settle(startPage), 380);
}

async function turnTo(nextPage, direction) {
  if (!open || busy || nextPage === page || !leaves[nextPage]) return;
  if (motionPreference.matches) { settle(nextPage); return; }
  busy = true;
  buttons();
  const generation = ++turnGeneration;
  await Promise.race([warmPage(nextPage), new Promise(resolve => setTimeout(resolve, 180))]);
  if (generation !== turnGeneration || !open) return;
  if (direction > 0) {
    paint(under, nextPage);
    animateTurn("rotateY(0deg)", "rotateY(-110deg)", () => settle(nextPage));
  } else {
    paint(under, page);
    paint(front, nextPage);
    animateTurn("rotateY(-110deg)", "rotateY(0deg)", () => settle(nextPage));
  }
}

function onwardTurn() { turnTo(page + 1, 1); }

function shutCover(finished = false) {
  stopTurn();
  if (open) {
    resume[chapter] = finished ? 0 : page;
    saveResume();
  }
  open = false;
  page = 0;
  leafbox.hidden = true;
  paint(front, -1);
  paint(under, -1);
  busy = false;
  buttons();
}

function returnToStart(finished = false) {
  // 合上书后停在刚读的这一章封面；同时作废进行中的翻页动画与图片解码回调。
  shutCover(finished);
  const url = new URL(location.href);
  if (url.searchParams.has("cover")) {
    url.searchParams.delete("cover");
    history.replaceState(null, "", url);
  }
  sync();
  poke();
  field.focus({ preventScroll: true });
}

closeBook.addEventListener("click", event => { event.stopPropagation(); returnToStart(); });
// 焦点不在田地里（比如翻页按钮刚被禁用）时，Esc 也能合上书
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !open || field.contains(event.target)) return;
  event.preventDefault();
  returnToStart();
});

function closeChapter() {
  if (!open) return;
  if (busy) { returnToStart(); return; }
  const finished = page >= leaves.length - 1;
  paint(under, -1);
  animateTurn("rotateY(0deg)", "rotateY(-100deg)", () => returnToStart(finished), 340);
}

function forward() {
  if (!open || busy) return;
  if (page >= leaves.length - 1) closeChapter();
  else onwardTurn();
}

function foldTurn() {
  if (!open || busy) return;
  if (page === 0) {
    closeChapter();
    return;
  }
  turnTo(page - 1, -1);
}

dogear.addEventListener("click", (event) => {
  event.stopPropagation();
  openCover();
});
onward.addEventListener("click", (event) => {
  event.stopPropagation();
  forward();
});
fold.addEventListener("click", (event) => {
  event.stopPropagation();
  foldTurn();
});

for (const corner of [dogear, onward]) {
  corner.addEventListener("pointermove", event => {
    if (corner.disabled || motionPreference.matches) return;
    const box = corner.getBoundingClientRect();
    corner.style.setProperty("--curl-pull-x", `${((event.clientX - box.left) / box.width - .5) * 8}px`);
    corner.style.setProperty("--curl-pull-y", `${((event.clientY - box.top) / box.height - .5) * 8}px`);
  });
  corner.addEventListener("pointerleave", () => {
    corner.style.removeProperty("--curl-pull-x");
    corner.style.removeProperty("--curl-pull-y");
  });
}

let swipeStart = null;
leafbox.addEventListener("pointerdown", event => {
  if (busy || event.target.closest("a,button")) return;
  swipeStart = { x: event.clientX, y: event.clientY };
});
leafbox.addEventListener("pointerup", event => {
  if (!swipeStart) return;
  const dx = event.clientX - swipeStart.x, dy = event.clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.3) dx < 0 ? forward() : foldTurn();
});
leafbox.addEventListener("pointercancel", () => { swipeStart = null; });
window.addEventListener("resize", () => { if (open && busy) settle(page); resize(); });
document.addEventListener("visibilitychange", () => { if (document.hidden && open && busy) settle(page); });
motionPreference.addEventListener("change", () => { if (open && busy) settle(page); });
resize();

const cover = Number(new URLSearchParams(location.search).get("cover"));
if (cover === 3) {
  goTo(3, true);
  shown = 3;
  line.textContent = phrases[3];
  poke();
  openCover();
} else {
  let saved = 0;
  try { saved = Number(localStorage.getItem(COVER_KEY)) || 0; } catch {}
  goTo(saved, true);
}
