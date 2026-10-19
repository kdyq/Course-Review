(function () {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function readTheme() {
    try {
      return localStorage.getItem("course-review-theme") === "dark" ? "dark" : "light";
    } catch (error) {
      return "light";
    }
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const isDark = theme === "dark";
      button.setAttribute("aria-pressed", String(isDark));
      button.setAttribute("aria-label", isDark ? "切换到亮色模式" : "切换到暗黑模式");
    });
  }

  applyTheme(readTheme());

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem("course-review-theme", next);
      } catch (error) {
        /* local file previews can block storage */
      }
    });
  });

  if (typeof gsap === "undefined") {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  function starMarkup(value) {
    const rounded = Math.round(value * 2) / 2;
    const full = Math.floor(rounded);
    const half = rounded % 1 !== 0;
    let markup = "";
    for (let index = 0; index < 5; index += 1) {
      if (index < full) {
        markup += '<i class="ph-fill ph-star" aria-hidden="true"></i>';
      } else if (index === full && half) {
        markup += '<i class="ph-fill ph-star-half" aria-hidden="true"></i>';
      } else {
        markup += '<i class="ph ph-star" aria-hidden="true"></i>';
      }
    }
    return markup;
  }

  function animateCounters() {
    gsap.utils.toArray("[data-count]").forEach((element) => {
      const end = parseFloat(element.dataset.count);
      const decimals = Number(element.dataset.decimals || 0);
      const useComma = element.dataset.format === "comma";
      const state = { value: 0 };

      gsap.to(state, {
        value: end,
        duration: 1.3,
        ease: "power2.out",
        scrollTrigger: {
          trigger: element,
          start: "top 94%",
          once: true,
        },
        onUpdate: () => {
          element.textContent = useComma
            ? Math.round(state.value).toLocaleString("zh-CN")
            : state.value.toFixed(decimals);
        },
      });
    });
  }

  if (reduceMotion) {
    gsap.utils.toArray("[data-count]").forEach((element) => {
      const end = parseFloat(element.dataset.count);
      const decimals = Number(element.dataset.decimals || 0);
      element.textContent = element.dataset.format === "comma"
        ? Math.round(end).toLocaleString("zh-CN")
        : end.toFixed(decimals);
    });
  } else {
    const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });

    heroTimeline
      .from(".site-header", { autoAlpha: 0, y: -12, duration: 0.5 })
      .from(".hero .line > span", { yPercent: 115, duration: 0.9, stagger: 0.12 }, "-=0.2")
      .from(".hero-sub", { autoAlpha: 0, y: 16, duration: 0.6 }, "-=0.55")
      .from(".hero-actions .btn", { autoAlpha: 0, y: 14, duration: 0.5, stagger: 0.08 }, "-=0.4")
      .from(".hero-note", { autoAlpha: 0, duration: 0.5 }, "-=0.3")
      .from(".hero-photo", { autoAlpha: 0, scale: 1.04, duration: 1 }, "-=0.8")
      .from(".ledger-card", { autoAlpha: 0, y: 28, duration: 0.7 }, "-=0.65");

    gsap.utils.toArray(".section-head").forEach((head) => {
      gsap.from(head, {
        autoAlpha: 0,
        y: 24,
        duration: 0.6,
        scrollTrigger: { trigger: head, start: "top 86%", once: true },
      });
    });

    ScrollTrigger.batch(".course-card", {
      start: "top 88%",
      once: true,
      onEnter: (batch) => {
        gsap.from(batch, {
          autoAlpha: 0,
          y: 28,
          duration: 0.65,
          stagger: 0.08,
          ease: "power3.out",
        });
      },
    });

    ScrollTrigger.batch(".rank-list li", {
      start: "top 90%",
      once: true,
      onEnter: (batch) => {
        gsap.from(batch, {
          autoAlpha: 0,
          y: 18,
          duration: 0.5,
          stagger: 0.06,
          ease: "power2.out",
        });
      },
    });

    gsap.from(".review-card", {
      autoAlpha: 0,
      y: 30,
      duration: 0.7,
      scrollTrigger: { trigger: ".review-card", start: "top 84%", once: true },
    });

    gsap.from(".review-guide", {
      autoAlpha: 0,
      y: 30,
      duration: 0.7,
      delay: 0.08,
      scrollTrigger: { trigger: ".review-guide", start: "top 84%", once: true },
    });

    gsap.to(".hero-photo img", {
      yPercent: 5,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    animateCounters();
  }

  const tabs = document.querySelectorAll("[data-rank-tab]");
  const rankList = document.querySelector("[data-rank-list]");

  function updateRankList(key) {
    if (!rankList) {
      return;
    }

    const rows = Array.from(rankList.children);
    rows.sort((a, b) => parseFloat(b.dataset[key]) - parseFloat(a.dataset[key]));

    rows.forEach((row, index) => {
      const value = row.dataset[key];
      const rank = row.querySelector(".rank");
      const score = row.querySelector(".rank-score strong");
      const stars = row.querySelector(".rank-score .stars");
      if (rank) {
        rank.textContent = String(index + 1).padStart(2, "0");
      }
      if (score) {
        score.textContent = value;
      }
      if (stars) {
        stars.innerHTML = starMarkup(parseFloat(value));
        stars.setAttribute("aria-label", `评分 ${value} 分，满分 5 分`);
      }
      rankList.appendChild(row);
    });

    if (!reduceMotion) {
      gsap.fromTo(
        rankList.querySelectorAll(".rank-score strong"),
        { autoAlpha: 0, y: 6 },
        { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.04, ease: "power2.out" }
      );
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => item.setAttribute("aria-selected", String(item === tab)));
      updateRankList(tab.dataset.rankTab);
    });
  });

  window.addEventListener("load", () => {
    ScrollTrigger.refresh();
  });
})();
