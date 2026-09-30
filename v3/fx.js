(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sel = [
    ".jump-main a",
    ".jump-sub a",
    ".intro-photo",
    ".intro-copy",
    ".next-head",
    ".ncard",
    ".lms h2",
    ".lms .lead",
    ".lms-tabs",
    ".lms-stage",
    ".vision-copy",
    ".vision-stage",
    ".news h2",
    ".news-grid",
    ".cta-in",
    ".toc a",
    ".greet-in > *",
    ".corp-fact",
    ".aim",
    ".history-in > *",
    ".org-tree",
    ".depts article",
    ".nets article",
    ".corp-visit",
    ".cat",
    ".step",
    ".course-card",
    ".gcol",
    ".chapter",
    ".ask-grid > *",
    ".fact",
    ".split > *"
  ].join(",");
  const nodes = [...document.querySelectorAll(sel)];
  if (!nodes.length) return;
  if (reduce) {
    nodes.forEach((el) => el.classList.add("is-in"));
    return;
  }
  nodes.forEach((el, i) => {
    el.classList.add("reveal");
    const sibs = el.parentElement ? [...el.parentElement.children].filter((n) => n.classList.contains("reveal")) : [];
    const idx = Math.max(0, sibs.indexOf(el));
    el.style.setProperty("--d", idx * 70 + "ms");
  });
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
  );
  nodes.forEach((el) => io.observe(el));
})();
