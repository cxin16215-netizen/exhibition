const drops = [...document.querySelectorAll(".drop")];

const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
let hideTimer = 0;

function closeMenu(drop) {
  window.clearTimeout(drop.hideTimer);
  drop.classList.remove("is-open");
  drop.querySelector("button").setAttribute("aria-expanded", "false");
}

function openMenu(drop) {
  drops.forEach((other) => { if (other !== drop) closeMenu(other); });
  window.clearTimeout(drop.hideTimer);
  drop.classList.add("is-open");
  drop.querySelector("button").setAttribute("aria-expanded", "true");
}

function scheduleClose(drop) {
  window.clearTimeout(drop.hideTimer);
  drop.hideTimer = window.setTimeout(() => closeMenu(drop), 420);
}

drops.forEach((drop) => {
  const menuButton = drop.querySelector("button");
  if (canHover) {
    drop.addEventListener("mouseenter", () => openMenu(drop));
    drop.addEventListener("mouseleave", () => scheduleClose(drop));
    menuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      openMenu(drop);
    });
  } else {
    menuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      if (drop.classList.contains("is-open")) closeMenu(drop);
      else openMenu(drop);
    });
  }
  drop.addEventListener("focusin", () => openMenu(drop));
  drop.addEventListener("focusout", (event) => {
    if (!drop.contains(event.relatedTarget)) scheduleClose(drop);
  });
});

document.addEventListener("click", (event) => {
  if (!drops.some((drop) => drop.contains(event.target))) drops.forEach(closeMenu);
});

document.querySelectorAll(".nav a, .panel a").forEach((link) => {
  link.addEventListener("click", () => drops.forEach(closeMenu));
});
