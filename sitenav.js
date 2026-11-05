(() => {
  const nav = document.querySelector(".gnav");
  if (!nav) return;
  const root = document.documentElement;
  const setHeight = () => root.style.setProperty("--gnav-h", `${nav.offsetHeight}px`);
  setHeight();
  window.addEventListener("resize", setHeight);

  const drops = [...nav.querySelectorAll(".gnav__drop")];
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const close = (d) => {
    clearTimeout(d.hideTimer);
    d.classList.remove("is-open");
    d.querySelector("button").setAttribute("aria-expanded", "false");
  };
  const open = (d) => {
    drops.forEach((o) => { if (o !== d) close(o); });
    clearTimeout(d.hideTimer);
    d.classList.add("is-open");
    d.querySelector("button").setAttribute("aria-expanded", "true");
  };
  const later = (d) => { clearTimeout(d.hideTimer); d.hideTimer = setTimeout(() => close(d), 420); };

  drops.forEach((d) => {
    const btn = d.querySelector("button");
    if (canHover) {
      d.addEventListener("mouseenter", () => open(d));
      d.addEventListener("mouseleave", () => later(d));
    }
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (d.classList.contains("is-open") && !canHover) close(d); else open(d);
    });
    d.addEventListener("focusout", (e) => { if (!d.contains(e.relatedTarget)) later(d); });
  });
  document.addEventListener("click", (e) => { if (!nav.contains(e.target)) drops.forEach(close); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") drops.forEach(close); });
})();
