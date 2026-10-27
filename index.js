const drop = document.querySelector(".drop");
const menuButton = drop.querySelector("button");
const stage = document.querySelector(".stage");
const slides = [...document.querySelectorAll(".slide")];
const thumbs = [...document.querySelectorAll(".thumbs button")];
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const DURATION = 7000;
let index = 0;
let timer = 0;

const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
let hideTimer = 0;

function closeMenu() {
  window.clearTimeout(hideTimer);
  drop.classList.remove("is-open");
  menuButton.setAttribute("aria-expanded", "false");
}

function openMenu() {
  window.clearTimeout(hideTimer);
  drop.classList.add("is-open");
  menuButton.setAttribute("aria-expanded", "true");
}

function scheduleClose() {
  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(closeMenu, 420);
}

if (canHover) {
  drop.addEventListener("mouseenter", openMenu);
  drop.addEventListener("mouseleave", scheduleClose);
  menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openMenu();
  });
} else {
  menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (drop.classList.contains("is-open")) closeMenu();
    else openMenu();
  });
}

drop.addEventListener("focusin", openMenu);
drop.addEventListener("focusout", (event) => {
  if (!drop.contains(event.relatedTarget)) scheduleClose();
});

document.addEventListener("click", (event) => {
  if (!drop.contains(event.target)) closeMenu();
});

document.querySelectorAll(".nav a, .panel a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

function restartProgress() {
  const bar = stage.querySelector(".progress i");
  stage.classList.remove("is-playing");
  void bar.offsetWidth;
  if (!reduce) stage.classList.add("is-playing");
}

function show(next) {
  index = (next + slides.length) % slides.length;
  slides.forEach((slide, i) => {
    const on = i === index;
    slide.classList.toggle("is-on", on);
    if (on) slide.removeAttribute("inert");
    else slide.setAttribute("inert", "");
  });
  thumbs.forEach((thumb, i) => {
    const on = i === index;
    thumb.classList.toggle("is-on", on);
    if (on) thumb.setAttribute("aria-current", "true");
    else thumb.removeAttribute("aria-current");
  });
  stage.dataset.theme = slides[index].dataset.theme;
  restartProgress();
  window.clearTimeout(timer);
  if (!reduce) timer = window.setTimeout(() => show(index + 1), DURATION);
}

document.querySelector(".next").addEventListener("click", () => show(index + 1));
document.querySelector(".prev").addEventListener("click", () => show(index - 1));
thumbs.forEach((thumb, i) => thumb.addEventListener("click", () => show(i)));

stage.addEventListener("mouseenter", () => window.clearTimeout(timer));
stage.addEventListener("mouseleave", () => {
  if (!reduce) timer = window.setTimeout(() => show(index + 1), DURATION);
});

show(0);
