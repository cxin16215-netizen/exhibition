const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* 灯跟着鼠标走 */
const lamp = document.getElementById("lamp");
if (lamp && !reduce && window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener("pointermove", (e) => {
    lamp.style.left = `${e.clientX}px`;
    lamp.style.top = `${e.clientY}px`;
  }, { passive: true });
}

/* 面单「内含」轮流打字 */
const slot = document.getElementById("contents");
const items = ["一年的日子", "热水壶 ×1", "舍不得扔的空白卡片", "即食牛肉与配菜", "修箱子的替代材料", "做手工的材料包", "6×5 便当盒"];
if (slot && !reduce) {
  let i = 0;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const run = async () => {
    while (true) {
      await wait(2200);
      const cur = items[i];
      for (let n = cur.length; n >= 0; n--) { slot.textContent = cur.slice(0, n); await wait(40); }
      i = (i + 1) % items.length;
      const next = items[i];
      for (let n = 1; n <= next.length; n++) { slot.textContent = next.slice(0, n); await wait(85); }
    }
  };
  run();
}
