const library = window.LIBRARY || null;
const note = document.getElementById("note");
if (!library) {
  note.hidden = false;
} else {
  document.getElementById("who").textContent = library.onlineId;
  document.getElementById("stats").innerHTML = [
    [library.level, "等级"],
    [library.platinum, "白金"],
    [library.titles, "有奖杯的作品"],
    [library.hours, "小时"],
  ].map(([n, label]) => `<li><strong>${n}</strong><span>${label}</span></li>`).join("");
  const card = (item) => `<figure><img alt="" src="${item.image}" onerror="this.removeAttribute('src')"><figcaption>${item.name}${item.hours ? `<br>${item.hours} 小时` : ""}</figcaption></figure>`;
  document.getElementById("rail").innerHTML = library.rail.map(card).join("");
  const meter = (p) => {
    if (!p) return "<span></span>";
    const v = Math.round(p);
    return `<span class="meter${v >= 100 ? " full" : ""}"><i style="--p:${Math.min(v, 100)}%"></i>${v}%</span>`;
  };
  const row = (item) => `<div class="row"><img class="thumb" alt="" loading="lazy" src="${item.image}" onerror="this.removeAttribute('src')"><span>${item.name}</span>${meter(item.progress)}</div>`;
  document.getElementById("plats").innerHTML = library.plats.map((item) => `<figure class="plat"><img alt="${item.name}" loading="lazy" src="${item.image}" onerror="this.removeAttribute('src')"><figcaption>${item.name}</figcaption></figure>`).join("");
  const all = document.getElementById("all");
  const count = document.getElementById("count");
  const paint = () => {
    const q = document.getElementById("q").value.trim().toLocaleLowerCase();
    const rows = library.worked.filter((item) => item.name.toLocaleLowerCase().includes(q));
    all.innerHTML = rows.map(row).join("");
    count.textContent = `${rows.length} / ${library.worked.length}`;
  };
  document.getElementById("q").addEventListener("input", paint);
  paint();
}
