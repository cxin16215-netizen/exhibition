const field = document.getElementById("field");
const canvas = document.getElementById("wash");
const notch = document.getElementById("notch");
const line = document.getElementById("line");
const phrases = ["一颗石", "穗出来了", "一块布", "一张纸"];
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
  const ratio = Math.min(2, window.devicePixelRatio || 1);
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
  const value = Math.round(t * 100);
  field.setAttribute("aria-valuenow", String(value));
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

field.addEventListener("wheel", (event) => {
  event.preventDefault();
  setT(t + event.deltaY * 0.00055);
}, { passive: false });

field.addEventListener("pointerdown", (event) => {
  dragging = true;
  field.setPointerCapture(event.pointerId);
  pointerX = event.clientX / width;
  pointerY = event.clientY / height;
});

field.addEventListener("pointermove", (event) => {
  pointerX = event.clientX / width;
  pointerY = event.clientY / height;
  if (dragging) setT((event.clientY - height * 0.14) / (height * 0.72));
  else poke();
});

const release = () => {
  dragging = false;
};
field.addEventListener("pointerup", release);
field.addEventListener("pointercancel", release);

field.addEventListener("keydown", (event) => {
  const step = event.shiftKey ? 0.12 : 0.04;
  if (event.key === "ArrowDown" || event.key === "ArrowRight") {
    event.preventDefault();
    setT(t + step);
  } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
    event.preventDefault();
    setT(t - step);
  } else if (event.key === "Home") {
    event.preventDefault();
    setT(0);
  } else if (event.key === "End") {
    event.preventDefault();
    setT(1);
  }
});

window.addEventListener("resize", resize);
resize();
