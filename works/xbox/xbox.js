const library = window.LIBRARY || null;
if (!library) {
  document.getElementById("note").hidden = false;
} else {
  document.getElementById("tag").textContent = library.gamertag;
  document.getElementById("tally").innerHTML = `<strong>${library.gamerscore}</strong> 成就分数 · ${library.titles} 部作品 · ${library.progressed} 部有进度`;
  const thumb = (item) => item.image ? `<img class="thumb" alt="" src="${item.image}">` : `<i class="thumb"></i>`;
  document.getElementById("rail").innerHTML = library.top.map((item) => `<figure>${thumb(item)}<figcaption>${item.name}<br>${item.score}</figcaption></figure>`).join("");
  const list = document.getElementById("list");
  const count = document.getElementById("count");
  const paint = () => {
    const q = document.getElementById("q").value.trim().toLocaleLowerCase();
    const rows = library.rows.filter((item) => item.name.toLocaleLowerCase().includes(q));
    list.innerHTML = rows.map((item) => `<div class="row">${thumb(item)}<span>${item.name}</span><span>${item.score || ""}</span></div>`).join("");
    count.textContent = `${rows.length} / ${library.rows.length}`;
    list.querySelectorAll("img").forEach((img) => img.addEventListener("error", () => img.replaceWith(Object.assign(document.createElement("i"), { className: "thumb" }))));
  };
  document.getElementById("q").addEventListener("input", paint);
  paint();
}
