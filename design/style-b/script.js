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

  function setFinalCounters() {
    document.querySelectorAll("[data-count]").forEach((element) => {
      const end = parseFloat(element.dataset.count);
      const decimals = Number(element.dataset.decimals || 0);
      element.textContent = element.dataset.format === "comma"
        ? Math.round(end).toLocaleString("zh-CN")
        : end.toFixed(decimals);
    });
  }

  function animateCounters() {
    document.querySelectorAll("[data-count]").forEach((element) => {
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
    setFinalCounters();
  } else {
    const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });

    heroTimeline
      .from(".site-header", { autoAlpha: 0, y: -10, duration: 0.45 })
      .from(".eyebrow", { autoAlpha: 0, y: 10, duration: 0.45 }, "-=0.15")
      .from(".hero .line > span", { yPercent: 115, duration: 0.85, stagger: 0.11 }, "-=0.2")
      .from(".hero-sub", { autoAlpha: 0, y: 14, duration: 0.55 }, "-=0.5")
      .from(".hero-actions .btn", { autoAlpha: 0, y: 12, duration: 0.45, stagger: 0.07 }, "-=0.35")
      .from(".hero-bento .bento-card", {
        autoAlpha: 0,
        y: 18,
        scale: 0.98,
        duration: 0.65,
        stagger: 0.07,
        ease: "power3.out",
      }, "-=0.55");

    gsap.utils.toArray(".section-head").forEach((head) => {
      gsap.from(head, {
        autoAlpha: 0,
        y: 22,
        duration: 0.55,
        scrollTrigger: { trigger: head, start: "top 86%", once: true },
      });
    });

    ScrollTrigger.batch(".course-card", {
      start: "top 88%",
      once: true,
      onEnter: (batch) => {
        gsap.from(batch, {
          autoAlpha: 0,
          y: 24,
          duration: 0.55,
          stagger: 0.06,
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
          y: 16,
          duration: 0.45,
          stagger: 0.05,
          ease: "power2.out",
        });
      },
    });

    gsap.from(".review-card", {
      autoAlpha: 0,
      y: 26,
      duration: 0.65,
      scrollTrigger: { trigger: ".review-card", start: "top 84%", once: true },
    });

    gsap.from(".trust-item", {
      autoAlpha: 0,
      y: 22,
      duration: 0.55,
      stagger: 0.07,
      scrollTrigger: { trigger: ".trust-aside", start: "top 84%", once: true },
    });

    animateCounters();
  }

  /* Search and department filters */
  const grid = document.querySelector("[data-course-grid]");
  const cards = Array.from(document.querySelectorAll("[data-course-grid] .course-card"));
  const emptyState = document.querySelector("[data-empty-state]");
  const courseSearch = document.getElementById("course-search");
  const courseSearchForm = document.getElementById("course-search-form");
  const navSearch = document.querySelector(".nav-search");
  const navSearchInput = document.getElementById("nav-search");
  const filterPills = document.querySelectorAll("[data-filter]");
  let activeFilter = "all";

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function applyFilter() {
    if (!grid || !emptyState || !courseSearch) {
      return;
    }

    const query = normalize(courseSearch.value);
    let visible = 0;

    cards.forEach((card) => {
      const deptMatch = activeFilter === "all" || card.dataset.dept === activeFilter;
      const textMatch = !query || normalize(card.dataset.search).includes(query);
      const show = deptMatch && textMatch;
      card.hidden = !show;
      if (show) {
        visible += 1;
      }
    });

    grid.hidden = visible === 0;
    emptyState.hidden = visible !== 0;

    if (!reduceMotion && visible > 0) {
      const shownCards = cards.filter((card) => !card.hidden);
      gsap.fromTo(
        shownCards,
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.03, ease: "power2.out", overwrite: true }
      );
    }

    ScrollTrigger.refresh();
  }

  function resetFilter() {
    if (courseSearch) {
      courseSearch.value = "";
    }
    if (navSearchInput) {
      navSearchInput.value = "";
    }
    activeFilter = "all";
    filterPills.forEach((pill) => {
      const active = pill.dataset.filter === "all";
      pill.classList.toggle("is-active", active);
      pill.setAttribute("aria-pressed", String(active));
    });
    applyFilter();
  }

  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      activeFilter = pill.dataset.filter;
      filterPills.forEach((item) => {
        const active = item === pill;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      applyFilter();
    });
  });

  if (courseSearch) {
    courseSearch.addEventListener("input", applyFilter);
  }

  if (courseSearchForm) {
    courseSearchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      applyFilter();
      document.getElementById("courses")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  if (navSearch && navSearchInput) {
    navSearch.addEventListener("submit", (event) => {
      event.preventDefault();
      if (courseSearch) {
        courseSearch.value = navSearchInput.value;
      }
      applyFilter();
      document.getElementById("courses")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      courseSearch?.focus({ preventScroll: true });
    });
  }

  document.querySelectorAll("[data-search-jump]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      document.getElementById("courses")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      window.setTimeout(() => courseSearch?.focus({ preventScroll: true }), reduceMotion ? 0 : 450);
    });
  });

  document.querySelector("[data-reset-filter]")?.addEventListener("click", resetFilter);

  /* Ranking tabs */
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
        rank.textContent = String(index + 1);
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
        rows,
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.04, ease: "power2.out", overwrite: true }
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
