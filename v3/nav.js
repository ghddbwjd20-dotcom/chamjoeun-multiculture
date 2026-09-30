(function () {
  const hd = document.querySelector("header");
  const btn = document.querySelector(".menu-btn");
  if (!hd || !btn) return;
  const set = (open) => {
    hd.classList.toggle("is-open", open);
    document.body.classList.toggle("is-menu", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  };
  btn.addEventListener("click", () => set(!hd.classList.contains("is-open")));
  hd.querySelectorAll("nav a").forEach((a) => a.addEventListener("click", () => set(false)));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) set(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") set(false);
  });
})();
