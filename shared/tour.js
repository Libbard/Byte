(() => {
  const root = document.documentElement;
  const state = {
    lang: localStorage.getItem("garden_lang") === "en" ? "en" : "ar",
    theme: ["dark", "dim"].includes(root.dataset.theme) ? root.dataset.theme : "dark",
    data: null,
    filter: "all",
    query: "",
    courseColour: "#ef4444",
    studyTheme: "tokyo",
    planDensity: 2
  };

  const copy = {
    all: { ar: "الكل", en: "All" },
    feature: { ar: "خاصية", en: "features" },
    open: { ar: "افتح الخاصية", en: "Open feature" },
    empty: { ar: "لا توجد خصائص مطابقة. جرّب عبارة أخرى.", en: "No matching features. Try another phrase." },
    correct: { ar: "صحيح. أساس النظام السداسي عشر هو 16.", en: "Correct. Hexadecimal has a radix of 16." },
    wrong: { ar: "ليست هذه. تذكّر أن أرقامه تمتد من 0 إلى F.", en: "Not this one. Remember that its digits run from 0 to F." },
    circuitOn: { ar: "المدخلان مفعّلان؛ بوابة AND أضاءت الخرج.", en: "Both inputs are on; the AND gate lights the output." },
    circuitOff: { ar: "فعّل المدخلين معاً ليضيء الخرج.", en: "Turn on both inputs to light the output." },
    grade: {
      0: { ar: "ستعود البطاقة قريباً حتى تثبت.", en: "The card will return soon so it can stick." },
      1: { ar: "ستعود غداً؛ كانت الإجابة صعبة.", en: "It will return tomorrow; the answer was hard." },
      2: { ar: "جيد. ستعود بعد 4 أيام.", en: "Good. It will return in 4 days." },
      3: { ar: "أتقنتها. ستعود بعد 9 أيام.", en: "Mastered. It will return in 9 days." }
    },
    depth: {
      quick: {
        ar: "خلاصة مركّزة تعيد المفهوم إلى ذهنك في دقيقتين.",
        en: "A focused recap that restores the concept in two minutes."
      },
      full: {
        ar: "شرح متوازن يبني الفكرة ثم يثبتها بمثال ومقارنة.",
        en: "A balanced explanation that builds the idea, then anchors it with an example and comparison."
      },
      deep: {
        ar: "تفاصيل أعمق، اشتقاقات وروابط تكشف لماذا تعمل الفكرة لا كيف تعمل فقط.",
        en: "Deeper detail, derivations, and connections that reveal why the idea works, not only how."
      }
    },
    target: {
      ambitious: {
        ar: "هدف طموح: يحتاج إلى أداء قريب من A في معظم الساعات المتبقية.",
        en: "An ambitious target: most remaining credits need performance near an A."
      },
      realistic: {
        ar: "هدف واقعي: تحتاج إلى متوسط B+ تقريباً في الساعات المتبقية.",
        en: "A realistic target: you need roughly a B+ average in the remaining credits."
      },
      comfortable: {
        ar: "هدف مريح: أنت على مسار يسمح بهامش جيد بين الفصول.",
        en: "A comfortable target: your path leaves a healthy margin between terms."
      }
    },
    planDensity: {
      1: { ar: "9 جلسات موزعة على 9 أيام، بمعدل جلسة واحدة يومياً.", en: "9 sessions across 9 days, averaging one session a day." },
      2: { ar: "18 جلسة موزعة على 9 أيام، مع مراجعة قبل كل اختبار.", en: "18 sessions across 9 days, with a review before every exam." },
      3: { ar: "27 جلسة موزعة على 9 أيام، مع مراجعتين متباعدتين للوحدات الثقيلة.", en: "27 sessions across 9 days, with two spaced reviews for demanding modules." }
    }
  };

  const text = value => value?.[state.lang] || "";
  const themes = ["dark", "dim"];
  const themeIcons = {
    dark: "fa-solid fa-cloud-moon",
    dim: "fa-solid fa-moon"
  };
  const themeNames = {
    dark: { ar: "الداكن", en: "dark theme" },
    dim: { ar: "الخافت", en: "dim theme" }
  };
  const studyThemeNames = {
    garden: { ar: "الحديقة الرقمية", en: "Digital Garden" },
    paper: { ar: "ورق دافئ", en: "Warm Paper" },
    github: { ar: "جِت هَب نهاري", en: "GitHub Light" },
    solar: { ar: "سولارايزد نهاري", en: "Solarized Light" },
    onedark: { ar: "ون دارك", en: "One Dark" },
    dracula: { ar: "دراكولا", en: "Dracula" },
    nord: { ar: "نورد", en: "Nord" },
    gruvbox: { ar: "جروف بوكس", en: "Gruvbox Dark" },
    oled: { ar: "أسود خالص", en: "True Black OLED" },
    tokyo: { ar: "طوكيو ليلاً", en: "Tokyo Night" },
    amber: { ar: "كهرماني", en: "Amber Night" }
  };

  function validColour(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value).toLowerCase() : "";
  }

  function savedCourseColour() {
    try {
      const preferences = JSON.parse(localStorage.getItem("dashboard_prefs") || "null");
      return validColour(preferences?.courseStyle?.CS231?.color) || "#ef4444";
    } catch {
      return "#ef4444";
    }
  }

  function savedStudyTheme() {
    try {
      const preferences = JSON.parse(localStorage.getItem("dashboard_prefs") || "null");
      return studyThemeNames[preferences?.moduleTheme] ? preferences.moduleTheme : "tokyo";
    } catch {
      return "tokyo";
    }
  }

  function updateThemeSwitch() {
    const button = document.getElementById("theme-switch");
    const icon = document.getElementById("theme-switch-icon");
    if (!button || !icon) return;
    const nextTheme = themes[(themes.indexOf(state.theme) + 1) % themes.length];
    const nextName = themeNames[nextTheme][state.lang];
    const label = state.lang === "ar" ? `التبديل إلى الثيم ${nextName}` : `Switch to the ${nextName}`;
    button.dataset.themeState = state.theme;
    button.setAttribute("aria-label", label);
    button.title = label;
    icon.innerHTML = `<i class="${themeIcons[state.theme]}" aria-hidden="true"></i>`;
  }

  function setTheme(theme, persist = true) {
    state.theme = themes.includes(theme) ? theme : "dark";
    root.dataset.theme = state.theme;
    document.querySelectorAll("[data-tour-theme]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.tourTheme === state.theme));
    });
    const themeColours = { light: "#ffffff", dark: "#1f2937", dim: "#171923" };
    document.querySelector("meta[name='theme-color']").content = themeColours[state.theme];
    updateThemeSwitch();
    if (persist) localStorage.setItem("garden_theme", state.theme);
    window.dispatchEvent(new CustomEvent("garden-theme-change", { detail: { theme: state.theme } }));
  }

  function setCourseColour(colour) {
    state.courseColour = validColour(colour) || "#ef4444";
    [document.getElementById("taste-stage"), document.getElementById("course-personalizer"), document.getElementById("learn")].forEach(element => {
      element?.style.setProperty("--course-accent", state.courseColour);
    });
    document.querySelectorAll("[data-course-colour]").forEach(button => {
      button.setAttribute("aria-checked", String(button.dataset.courseColour.toLowerCase() === state.courseColour));
    });
    const input = document.getElementById("course-colour-own");
    if (input) input.value = state.courseColour;
  }

  function setStudyTheme(theme) {
    state.studyTheme = studyThemeNames[theme] ? theme : "tokyo";
    const preview = document.getElementById("study-skin-preview");
    if (preview) preview.dataset.studyTheme = state.studyTheme;
    document.querySelectorAll("[data-study-theme]").forEach(button => {
      if (button.tagName === "BUTTON") button.setAttribute("aria-checked", String(button.dataset.studyTheme === state.studyTheme));
    });
    const name = document.getElementById("study-theme-name");
    if (name) name.textContent = text(studyThemeNames[state.studyTheme]);
  }

  function updatePlanDensity(density) {
    const value = Math.min(3, Math.max(1, Number(density) || 2));
    state.planDensity = value;
    const showcase = document.getElementById("intensive-showcase");
    if (showcase) showcase.dataset.planDensity = String(value);
    document.querySelectorAll(".plan-density [data-plan-density]").forEach(button => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.planDensity) === value));
    });
    const verdict = document.getElementById("plan-verdict");
    if (verdict) verdict.textContent = text(copy.planDensity[value]);
    const total = document.querySelector(".plan-board__head b");
    if (total) total.textContent = `09 DAYS · ${value * 9} SESSIONS`;
  }

  function setLanguage(lang) {
    state.lang = lang === "en" ? "en" : "ar";
    root.lang = state.lang;
    root.dir = state.lang === "ar" ? "rtl" : "ltr";
    document.body.dataset.lang = state.lang;
    document.title = state.lang === "ar" ? "اكتشف الحديقة الرقمية · الأطلس الحي" : "Explore the Digital Garden · The Living Atlas";
    document.querySelector("meta[name='description']").content = state.lang === "ar"
      ? "جولة تفاعلية في الحديقة الرقمية: الشرح، المراجعة، التخطيط، المعدل، الشُعب، المختبرات والمزامنة لطلاب الجامعة السعودية الإلكترونية."
      : "An interactive tour of the Digital Garden: learning, review, planning, GPA, sections, labs, and private sync for SEU students.";
    document.querySelectorAll("[data-ar][data-en]").forEach(element => {
      element.textContent = element.dataset[state.lang];
    });
    document.querySelectorAll("[data-ar-label][data-en-label]").forEach(element => {
      element.setAttribute("aria-label", element.dataset[`${state.lang}Label`]);
    });
    document.querySelectorAll("[data-ar-alt][data-en-alt]").forEach(element => {
      element.alt = element.dataset[`${state.lang}Alt`];
    });
    document.querySelectorAll("[data-ar-placeholder][data-en-placeholder]").forEach(element => {
      element.placeholder = element.dataset[`${state.lang}Placeholder`];
    });
    const switcher = document.getElementById("lang-switch");
    switcher.textContent = state.lang === "ar" ? "English" : "العربية";
    switcher.setAttribute("aria-label", state.lang === "ar" ? "Switch to English" : "التبديل إلى العربية");
    updateThemeSwitch();
    localStorage.setItem("garden_lang", state.lang);
    updateDepthCopy();
    updateTarget();
    updateCircuit();
    updateQuizFeedback();
    updatePlanDensity(state.planDensity);
    setStudyTheme(state.studyTheme);
    renderAtlas();
    renderStats();
    window.dispatchEvent(new CustomEvent("garden-language-change", { detail: { lang: state.lang } }));
  }

  function renderStats() {
    const target = document.getElementById("hero-stats");
    if (!target || !state.data) return;
    target.replaceChildren(...state.data.stats.map(item => {
      const node = document.createElement("span");
      node.className = "hero-stat";
      const value = document.createElement("b");
      const label = document.createElement("small");
      value.textContent = item.value;
      label.textContent = item[state.lang];
      node.append(value, label);
      return node;
    }));
  }

  function categoryName(id) {
    return state.data?.categories.find(category => category.id === id)?.[state.lang] || id;
  }

  function renderFilters() {
    const target = document.getElementById("atlas-filters");
    if (!target || !state.data) return;
    const categories = [{ id: "all", ar: copy.all.ar, en: copy.all.en }, ...state.data.categories];
    target.replaceChildren(...categories.map(category => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.filter = category.id;
      button.classList.toggle("is-active", state.filter === category.id);
      button.setAttribute("aria-pressed", String(state.filter === category.id));
      button.textContent = category[state.lang];
      button.addEventListener("click", () => {
        state.filter = category.id;
        renderFilters();
        renderAtlas();
      });
      return button;
    }));
  }

  function renderAtlas() {
    if (!state.data) return;
    renderFilters();
    const normalized = state.query.trim().toLocaleLowerCase(state.lang === "ar" ? "ar" : "en");
    const filtered = state.data.features.filter(feature => {
      const inCategory = state.filter === "all" || feature.category === state.filter;
      const searchable = `${feature.ar} ${feature.en} ${feature.desc_ar} ${feature.desc_en}`.toLocaleLowerCase();
      return inCategory && (!normalized || searchable.includes(normalized));
    });
    const grid = document.getElementById("atlas-grid");
    const result = document.getElementById("atlas-result");
    const featureCount = document.getElementById("feature-count");
    result.textContent = `${filtered.length} / ${state.data.features.length}`;
    featureCount.textContent = state.data.features.length;
    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "atlas__empty";
      empty.textContent = text(copy.empty);
      grid.replaceChildren(empty);
      return;
    }
    grid.replaceChildren(...filtered.map((feature, index) => {
      const article = document.createElement("article");
      article.className = "feature-card";
      const top = document.createElement("div");
      top.className = "feature-card__top";
      const number = document.createElement("span");
      number.className = "feature-card__index";
      number.textContent = String(index + 1).padStart(2, "0");
      const category = document.createElement("span");
      category.className = "feature-card__cat";
      category.textContent = categoryName(feature.category);
      top.append(number, category);
      const title = document.createElement("h3");
      title.textContent = feature[state.lang];
      const description = document.createElement("p");
      description.textContent = feature[`desc_${state.lang}`];
      const link = document.createElement("a");
      link.href = feature.href;
      const linkText = document.createElement("span");
      linkText.textContent = text(copy.open);
      const arrow = document.createElement("i");
      arrow.textContent = "↗";
      link.append(linkText, arrow);
      article.append(top, title, description, link);
      return article;
    }));
  }

  async function loadAtlas() {
    try {
      const response = await fetch("shared/data/tour-features.json");
      if (!response.ok) throw new Error(String(response.status));
      state.data = await response.json();
      renderStats();
      renderAtlas();
    } catch {
      document.getElementById("feature-count").textContent = "40+";
      const result = document.getElementById("atlas-result");
      result.textContent = state.lang === "ar" ? "تعذّر تحميل السجل" : "Ledger unavailable";
    }
  }

  function updateDepthCopy() {
    const selected = document.querySelector("[data-depth][aria-selected='true']")?.dataset.depth || "full";
    document.getElementById("depth-copy").textContent = text(copy.depth[selected]);
  }

  function updateQuizFeedback() {
    const feedback = document.getElementById("quiz-feedback");
    const selected = document.querySelector(".quiz-live__answers button.is-correct, .quiz-live__answers button.is-wrong");
    if (!selected) {
      feedback.textContent = feedback.dataset[state.lang];
      return;
    }
    feedback.textContent = text(copy[selected.dataset.answer]);
  }

  function updateTarget() {
    const range = document.getElementById("target-range");
    if (!range) return;
    const value = Number(range.value);
    const progress = ((value - Number(range.min)) / (Number(range.max) - Number(range.min))) * 100;
    range.style.setProperty("--range", `${progress}%`);
    document.getElementById("target-value").textContent = value.toFixed(2);
    const band = value >= 3.75 ? "ambitious" : value >= 3.25 ? "realistic" : "comfortable";
    document.getElementById("target-verdict").textContent = text(copy.target[band]);
  }

  function updateCircuit() {
    const demo = document.querySelector(".circuit-demo");
    if (!demo) return;
    const a = demo.dataset.a === "1";
    const b = demo.dataset.b === "1";
    const output = a && b;
    demo.dataset.out = output ? "1" : "0";
    demo.querySelectorAll("[data-input]").forEach(button => {
      const active = demo.dataset[button.dataset.input] === "1";
      button.setAttribute("aria-pressed", String(active));
      button.querySelector("b").textContent = active ? "1" : "0";
    });
    document.getElementById("circuit-output").textContent = output ? "1" : "0";
    document.getElementById("circuit-copy").textContent = text(output ? copy.circuitOn : copy.circuitOff);
  }

  function setupInteractions() {
    document.getElementById("lang-switch").addEventListener("click", () => setLanguage(state.lang === "ar" ? "en" : "ar"));
    document.getElementById("open-atlas").addEventListener("click", () => document.getElementById("atlas").scrollIntoView({ behavior: "smooth" }));
    document.getElementById("atlas-search").addEventListener("input", event => {
      state.query = event.target.value;
      renderAtlas();
    });
    document.querySelectorAll("[data-depth]").forEach(button => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-depth]").forEach(tab => tab.setAttribute("aria-selected", String(tab === button)));
        updateDepthCopy();
      });
    });
    const flashcard = document.getElementById("demo-flashcard");
    flashcard.addEventListener("click", () => flashcard.setAttribute("aria-pressed", String(flashcard.getAttribute("aria-pressed") !== "true")));
    document.querySelectorAll(".review-scale button").forEach(button => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".review-scale button").forEach(item => item.classList.toggle("is-picked", item === button));
        flashcard.querySelector(".demo-flashcard__back em").textContent = text(copy.grade[button.dataset.grade]);
        flashcard.setAttribute("aria-pressed", "true");
      });
    });
    document.querySelectorAll(".quiz-live__answers button").forEach(button => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".quiz-live__answers button").forEach(item => item.classList.remove("is-correct", "is-wrong"));
        const verdict = button.dataset.answer;
        button.classList.add(verdict === "correct" ? "is-correct" : "is-wrong");
        if (verdict === "wrong") document.querySelector("[data-answer='correct']").classList.add("is-correct");
        const feedback = document.getElementById("quiz-feedback");
        feedback.className = `quiz-live__feedback is-${verdict}`;
        feedback.textContent = text(copy[verdict]);
      });
    });
    document.getElementById("target-range").addEventListener("input", updateTarget);
    document.querySelectorAll(".plan-density [data-plan-density]").forEach(button => {
      button.addEventListener("click", () => updatePlanDensity(button.dataset.planDensity));
    });
    const circuit = document.querySelector(".circuit-demo");
    circuit.dataset.a = "0";
    circuit.dataset.b = "0";
    circuit.dataset.out = "0";
    circuit.querySelectorAll("[data-input]").forEach(button => {
      button.addEventListener("click", () => {
        const key = button.dataset.input;
        circuit.dataset[key] = circuit.dataset[key] === "1" ? "0" : "1";
        updateCircuit();
      });
    });
    const sync = document.getElementById("sync-stage");
    document.getElementById("sync-trigger").addEventListener("click", () => {
      sync.classList.remove("is-syncing");
      requestAnimationFrame(() => requestAnimationFrame(() => sync.classList.add("is-syncing")));
    });
  }

  function setupPersonalization() {
    document.getElementById("theme-switch").addEventListener("click", () => {
      setTheme(themes[(themes.indexOf(state.theme) + 1) % themes.length]);
    });
    document.querySelectorAll("[data-tour-theme]").forEach(button => {
      button.addEventListener("click", () => setTheme(button.dataset.tourTheme));
    });
    document.querySelectorAll("[data-course-colour]").forEach(button => {
      button.addEventListener("click", () => setCourseColour(button.dataset.courseColour));
    });
    document.querySelectorAll("button[data-study-theme]").forEach(button => {
      button.addEventListener("click", () => setStudyTheme(button.dataset.studyTheme));
    });
    document.getElementById("course-colour-own").addEventListener("input", event => setCourseColour(event.target.value));
    window.addEventListener("storage", event => {
      if (event.key === "garden_theme") setTheme(event.newValue, false);
      if (event.key === "dashboard_prefs") {
        setCourseColour(savedCourseColour());
        setStudyTheme(savedStudyTheme());
      }
    });
    setTheme(state.theme, false);
    setCourseColour(savedCourseColour());
    setStudyTheme(savedStudyTheme());
  }

  function setupMotion() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveals = document.querySelectorAll(".reveal");
    if (reduced || !("IntersectionObserver" in window)) {
      reveals.forEach(element => element.classList.add("is-visible"));
    } else {
      const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -12%", threshold: 0.08 });
      reveals.forEach(element => revealObserver.observe(element));
    }
    const semester = document.querySelector(".product-frame--semester");
    if (semester && !reduced) {
      const semesterObserver = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        window.setTimeout(() => semester.classList.add("is-exploring"), 450);
        semesterObserver.disconnect();
      }, { threshold: 0.42 });
      semesterObserver.observe(semester);
    }
    const chapters = document.querySelectorAll("[data-chapter]");
    const navLinks = document.querySelectorAll(".chapter-nav a");
    if ("IntersectionObserver" in window) {
      const chapterObserver = new IntersectionObserver(entries => {
        const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach(link => link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`));
      }, { rootMargin: "-32% 0px -54%", threshold: [0, .1, .5] });
      chapters.forEach(chapter => chapterObserver.observe(chapter));
    }
    const path = document.getElementById("living-root-line");
    const flow = document.getElementById("living-root-flow");
    const node = document.getElementById("living-root-node");
    const bar = document.getElementById("page-progress-bar");
    const topbar = document.getElementById("topbar");
    let ticking = false;
    const updateScroll = () => {
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
      if (path) {
        path.style.strokeDashoffset = String(1 - progress);
        if (node) {
          const point = path.getPointAtLength(path.getTotalLength() * progress);
          node.setAttribute("cx", point.x.toFixed(3));
          node.setAttribute("cy", point.y.toFixed(3));
          node.style.opacity = progress > .01 ? "1" : "0";
        }
      }
      if (flow) flow.style.setProperty("--scroll-progress", progress.toFixed(4));
      bar.style.transform = `scaleX(${progress})`;
      topbar.classList.toggle("is-scrolled", window.scrollY > 28);
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateScroll);
    }, { passive: true });
    window.addEventListener("resize", updateScroll, { passive: true });
    updateScroll();
  }

  root.classList.add("js");
  document.querySelectorAll("img").forEach(image => {
    image.decoding = "async";
  });
  setupInteractions();
  setupPersonalization();
  setupMotion();
  setLanguage(state.lang);
  loadAtlas();
  window.setTimeout(() => document.getElementById("sync-stage").classList.add("is-syncing"), 900);
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
