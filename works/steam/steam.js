const library = window.LIBRARY || null;
if (!library) {
  document.getElementById("note").hidden = false;
} else {
  document.getElementById("tally").textContent = `${library.played} 玩过`;
  const thumb = (item, wide) => item.image ? `<img class="thumb" alt="" src="${item.image}">` : `<i class="thumb"></i>`;
  document.getElementById("long").innerHTML = library.long.map((item) => `<article>${thumb(item)}<h2>${item.name}</h2><span>${item.hours}小时</span></article>`).join("");
  const rest = document.getElementById("rest");
  const count = document.getElementById("count");
  const paint = () => {
    const q = document.getElementById("q").value.trim().toLocaleLowerCase();
    const rows = library.rest.filter((item) => item.name.toLocaleLowerCase().includes(q));
    rest.innerHTML = rows.map((item) => `<div class="row">${thumb(item)}<span>${item.name}</span></div>`).join("");
    count.textContent = `${rows.length} / ${library.rest.length}`;
  };
  document.getElementById("q").addEventListener("input", paint);
  paint();
  document.getElementById("brief").innerHTML = library.brief.map((name) => `<li>${name}</li>`).join("");
}
