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

  /* Rating inputs work with or without GSAP */
  document.querySelectorAll("[data-rating-group]").forEach((group) => {
    const buttons = Array.from(group.querySelectorAll("button[data-value]"));
    const output = group.querySelector(".rating-output");
    let value = Number(group.dataset.value || 3);

    function render() {
      buttons.forEach((button) => {
        const buttonValue = Number(button.dataset.value);
        const active = buttonValue <= value;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-checked", String(buttonValue === value));
      });
      if (output) {
        output.textContent = value.toFixed(1);
      }
      group.dataset.value = String(value);
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        value = Number(button.dataset.value);
        render();
      });
    });

    group.querySelector(".rating-stars").addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }
      event.preventDefault();
      value = Math.min(5, Math.max(1, value + (event.key === "ArrowRight" ? 1 : -1)));
      render();
      buttons[value - 1].focus();
    });

    render();
  });

  document.querySelectorAll("[data-chip]").forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("is-active");
      chip.setAttribute("aria-pressed", String(chip.classList.contains("is-active")));
    });
  });

  const form = document.getElementById("review-form");
  const formMessage = document.querySelector("[data-form-message]");

  function showFormMessage(text, type) {
    if (!formMessage) {
      return;
    }
    formMessage.hidden = false;
    formMessage.textContent = text;
    formMessage.classList.remove("is-success", "is-error");
    formMessage.classList.add(type === "error" ? "is-error" : "is-success");

    if (typeof gsap !== "undefined" && !reduceMotion) {
      gsap.fromTo(
        formMessage,
        { autoAlpha: 0, y: 6 },
        { autoAlpha: 1, y: 0, duration: 0.28, ease: "power2.out" }
      );
    }
  }

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const courseInput = document.getElementById("review-course");
      const contentInput = document.getElementById("review-content");
      const ratingGroups = document.querySelectorAll("[data-rating-group]");
      const recommendation = ratingGroups[2] ? ratingGroups[2].dataset.value : "5";

      if (!courseInput || !courseInput.value.trim()) {
        showFormMessage("先填一下课程名称。", "error");
        courseInput?.focus();
        return;
      }

      if (!contentInput || contentInput.value.trim().length < 10) {
        showFormMessage("再多写一点吧，至少 10 个字。", "error");
        contentInput?.focus();
        return;
      }

      showFormMessage(
        `已保存为草稿（演示）：${courseInput.value.trim()}，推荐度 ${recommendation} 分。`,
        "success"
      );
    });
  }

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

  if (!reduceMotion) {
    const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });

    heroTimeline
      .from(".site-header", { autoAlpha: 0, y: -10, duration: 0.45 })
      .from(".sticker-label", { autoAlpha: 0, scale: 0.8, duration: 0.45, ease: "back.out(1.7)" }, "-=0.12")
      .from(".hero .line > span", { yPercent: 115, duration: 0.85, stagger: 0.11 }, "-=0.22")
      .from(".hero-sub", { autoAlpha: 0, y: 14, duration: 0.5 }, "-=0.48")
      .from(".hero-actions .btn", { autoAlpha: 0, y: 12, duration: 0.45, stagger: 0.08, ease: "back.out(1.4)" }, "-=0.32")
      .from(".hero-collage > *", {
        autoAlpha: 0,
        y: 22,
        scale: 0.9,
        duration: 0.65,
        stagger: 0.07,
        ease: "back.out(1.4)",
      }, "-=0.5");

    gsap.utils.toArray(".section-head").forEach((head) => {
      gsap.from(head, {
        autoAlpha: 0,
        y: 20,
        duration: 0.55,
        scrollTrigger: { trigger: head, start: "top 86%", once: true },
      });
    });

    ScrollTrigger.batch(".note-card", {
      start: "top 88%",
      once: true,
      onEnter: (batch) => {
        gsap.from(batch, {
          autoAlpha: 0,
          y: 26,
          scale: 0.96,
          duration: 0.65,
          stagger: 0.07,
          ease: "back.out(1.35)",
        });
      },
    });

    gsap.from(".rank-sheet", {
      autoAlpha: 0,
      y: 24,
      duration: 0.65,
      scrollTrigger: { trigger: ".rank-sheet", start: "top 84%", once: true },
    });

    gsap.from(".notebook", {
      autoAlpha: 0,
      y: 28,
      duration: 0.65,
      scrollTrigger: { trigger: ".notebook", start: "top 84%", once: true },
    });

    gsap.from(".tips-card", {
      autoAlpha: 0,
      y: 24,
      duration: 0.55,
      scrollTrigger: { trigger: ".tips-card", start: "top 86%", once: true },
    });

    gsap.from(".anon-note", {
      autoAlpha: 0,
      y: 20,
      duration: 0.55,
      delay: 0.08,
      scrollTrigger: { trigger: ".anon-note", start: "top 88%", once: true },
    });
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
      const rank = row.querySelector(".rank-number");
      const score = row.querySelector(".rank-score > strong");
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
