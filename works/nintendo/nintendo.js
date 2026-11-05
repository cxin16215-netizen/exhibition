const library = window.LIBRARY || null;
const covers = window.COVERS || {};

if (!library) {
  document.getElementById("note").hidden = false;
} else {
  const played = (library.played || []).slice().sort((a, b) => b.minutes - a.minutes);
  const brief = library.brief || [];

  const hoursText = (item) => {
    if (!item.minutes || item.minutes < 3000) return "";
    const more = item.floor ? "以上" : "";
    if (item.minutes < 60) return `${item.minutes} 分钟${more}`;
    return `${Math.floor(item.minutes / 60)} 小时${more}`;
  };

  // 总览数字
  const totalHours = Math.floor(played.reduce((sum, item) => sum + (item.minutes || 0), 0) / 60);
  document.getElementById("tally").innerHTML = [
    [played.length + brief.length, "部作品"],
    [`${totalHours}+`, "小时"],
    [played.length, "有游玩时长"],
  ].map(([n, label]) => `<li><strong>${n}</strong><span>${label}</span></li>`).join("");

  // 拼贴：1 个大块（占 2×2）+ 12 个普通块，4 列正好排满 4 行
  const featured = played.filter((item) => covers[item.name] || item.minutes >= 1200).slice(0, 13);
  document.getElementById("feature").innerHTML = featured.map((item, i) => {
    const src = covers[item.name];
    const size = i === 0 ? " big" : "";
    const img = src ? `<img alt="" loading="lazy" src="${src}" onerror="this.parentNode.classList.add('plain'); this.remove()">` : "";
    return `<figure class="card${size}${src ? "" : " plain"}">${img}<span class="rank">${String(i + 1).padStart(2, "0")}</span><figcaption><b>${item.name}</b>${hoursText(item) ? `<small>${hoursText(item)}</small>` : ""}</figcaption></figure>`;
  }).join("");

  // 其余：时长条
  const shown = new Set(featured.map((item) => item.name));
  const rest = played.filter((item) => !shown.has(item.name));
  const max = rest.length ? rest[0].minutes : 1;
  document.getElementById("names").innerHTML = rest.map((item) => {
    const w = Math.max(2, Math.round((item.minutes / max) * 100));
    return `<li><span>${item.name}</span>${hoursText(item) ? `<small>${hoursText(item)}</small>` : ""}<i style="--w:${w}%"></i></li>`;
  }).join("");

  // 浅尝
  document.getElementById("brief").innerHTML = brief.map((name) => `<li>${name}</li>`).join("");
}
