(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sel = [
    ".jump-main a",
    ".jump-sub a",
    ".intro-photo",
    ".intro-copy",
    ".works-left",
    ".works-visual",
    ".works-right",
    ".next-head",
    ".ncard",
    ".lms .kicker",
    ".lms h2",
    ".lms .lead",
    ".lms-tabs",
    ".lms-stage",
    ".lms .actions",
    ".vision-copy",
    ".vision-stage",
    ".news .kicker",
    ".news h2",
    ".news-main",
    ".news-card",
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
  const nodes = [...document.querySelectorAll(sel)].filter((el) => !el.closest(".reveal"));
  if (!nodes.length) return;
  if (reduce) {
    nodes.forEach((el) => el.classList.add("is-in"));
    return;
  }
  nodes.forEach((el) => {
    el.classList.add("reveal");
    const section = el.closest("section") || el.parentElement || document.body;
    const sibs = nodes.filter((n) => (n.closest("section") || n.parentElement) === section);
    const idx = Math.max(0, sibs.indexOf(el));
    el.style.setProperty("--d", idx * 140 + "ms");
  });
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
  );
  nodes.forEach((el) => io.observe(el));
})();
