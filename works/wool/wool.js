if (location.search.includes("cover")) {
  document.documentElement.classList.add("cover");
}

const lines = [
  "平台说你省了多少",
  "你真正省了多少",
  "这两列不是同一个数",
  "",
  "七个平台",
  "十二个月",
  "一间会变的屋子",
  "一枚旧金币",
];

const receipt = document.querySelector("#receipt");
const text = lines.join("\n");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduce) {
  receipt.textContent = text;
} else {
  let index = 0;
  const step = () => {
    receipt.textContent = text.slice(0, index);
    index += 1;
    if (index <= text.length) {
      window.setTimeout(step, text[index - 1] === "\n" ? 180 : 48);
    }
  };
  step();
}

const lamp = document.querySelector("#lamp");
if (lamp && !reduce && window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener(
    "pointermove",
    (event) => {
      lamp.style.left = `${event.clientX}px`;
      lamp.style.top = `${event.clientY}px`;
    },
    { passive: true }
  );
}
