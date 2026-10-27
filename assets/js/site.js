(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

  function initHeader() {
    const header = qs(".site-header");
    const navButton = qs(".nav-toggle");
    const nav = qs(".nav__links");
    if (!header || !navButton || !nav) return;

    const closeNav = () => {
      nav.classList.remove("is-open");
      navButton.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    };

    navButton.addEventListener("click", () => {
      const opening = navButton.getAttribute("aria-expanded") !== "true";
      navButton.setAttribute("aria-expanded", String(opening));
      nav.classList.toggle("is-open", opening);
      document.body.classList.toggle("menu-open", opening);
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeNav();
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".header-inner")) closeNav();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNav();
    });

    const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  function initReveal() {
    const elements = qsa(".reveal");
    if (!elements.length || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px" }
    );

    elements.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
      observer.observe(element);
    });
  }

  function initGallery() {
    qsa(".js-gallery").forEach((gallery) => {
      const main = qs(".gallery__main img", gallery);
      const buttons = qsa(".gallery__thumb", gallery);
      if (!main || !buttons.length) return;

      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          buttons.forEach((item) => item.classList.remove("is-active"));
          button.classList.add("is-active");
          main.style.opacity = "0.35";
          window.setTimeout(() => {
            main.src = button.dataset.src;
            main.alt = button.dataset.alt || main.alt;
            main.style.opacity = "1";
          }, 110);
        });
      });
    });
  }

  function initProductFilters() {
    const grid = qs("[data-product-grid]");
    if (!grid) return;

    const cards = qsa(".product-card", grid);
    const categoryButtons = qsa("[data-filter-category]");
    const search = qs("[data-product-search]");
    const count = qs("[data-results-count]");
    const empty = qs("[data-empty-state]");
    let activeCategory = "all";

    const applyFilters = () => {
      const query = (search?.value || "").trim().toLowerCase();
      let visible = 0;

      cards.forEach((card) => {
        const matchesCategory =
          activeCategory === "all" || card.dataset.category === activeCategory;
        const matchesSearch = !query || card.textContent.toLowerCase().includes(query);
        const show = matchesCategory && matchesSearch;
        card.hidden = !show;
        if (show) visible += 1;
      });

      if (count) count.textContent = String(visible);
      if (empty) empty.hidden = visible !== 0;
    };

    const setCategory = (category, updateUrl = true) => {
      activeCategory = category;
      categoryButtons.forEach((button) => {
        const selected = button.dataset.filterCategory === category;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      applyFilters();

      if (!updateUrl) return;
      const url = new URL(window.location.href);
      if (category === "all") url.searchParams.delete("category");
      else url.searchParams.set("category", category);
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    };

    categoryButtons.forEach((button) => {
      button.addEventListener("click", () => setCategory(button.dataset.filterCategory));
    });

    if (search) {
      search.addEventListener("input", applyFilters);
    }

    const requestedCategory = new URLSearchParams(window.location.search).get("category");
    const availableCategories = new Set(
      categoryButtons.map((button) => button.dataset.filterCategory)
    );
    setCategory(availableCategories.has(requestedCategory) ? requestedCategory : "all", false);
  }

  function initConfigTabs() {
    qsa("[data-config-group]").forEach((group) => {
      const tabs = qsa("[role='tab']", group);
      const panels = qsa("[role='tabpanel']", group);
      if (!tabs.length) return;

      const activate = (tab) => {
        tabs.forEach((item) => {
          const selected = item === tab;
          item.setAttribute("aria-selected", String(selected));
          item.tabIndex = selected ? 0 : -1;
        });
        panels.forEach((panel) => {
          panel.hidden = panel.id !== tab.getAttribute("aria-controls");
        });
      };

      tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => activate(tab));
        tab.addEventListener("keydown", (event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          let targetIndex = index;
          if (event.key === "ArrowLeft") targetIndex = (index - 1 + tabs.length) % tabs.length;
          if (event.key === "ArrowRight") targetIndex = (index + 1) % tabs.length;
          if (event.key === "Home") targetIndex = 0;
          if (event.key === "End") targetIndex = tabs.length - 1;
          activate(tabs[targetIndex]);
          tabs[targetIndex].focus();
        });
      });

      const initial =
        tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0];
      activate(initial);
    });
  }

  function initContactForm() {
    const form = qs("[data-quote-form]");
    if (!form) return;

    const modelSelect = qs("[name='model']", form);
    const requestedModel = new URLSearchParams(window.location.search).get("model");
    if (modelSelect && requestedModel) {
      const match = [...modelSelect.options].find((option) => option.value === requestedModel);
      if (match) modelSelect.value = requestedModel;
    }

    const send = (channel) => {
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const modelLabel =
        modelSelect?.selectedOptions?.[0]?.textContent?.trim() || "General inquiry";
      const lines = [
        "Energy storage quotation request",
        "",
        `Product / system: ${modelLabel}`,
        `Name: ${data.get("name") || ""}`,
        `Email: ${data.get("email") || ""}`,
        `Company: ${data.get("company") || ""}`,
        `Country / port: ${data.get("country") || ""}`,
        `Quantity: ${data.get("quantity") || ""}`,
        "",
        "Requirements:",
        `${data.get("requirements") || ""}`,
      ];
      const body = lines.join("\n");

      if (channel === "whatsapp") {
        const url = `https://wa.me/8615826560159?text=${encodeURIComponent(body)}`;
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      const subject = `Quotation request — ${modelLabel}`;
      window.location.href =
        `mailto:yizong2023@outlook.com?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;
    };

    qsa("[data-send-channel]", form).forEach((button) => {
      button.addEventListener("click", () => send(button.dataset.sendChannel));
    });
  }

  function initYear() {
    qsa("[data-year]").forEach((element) => {
      element.textContent = String(new Date().getFullYear());
    });
  }

  initHeader();
  initReveal();
  initGallery();
  initProductFilters();
  initConfigTabs();
  initContactForm();
  initYear();
})();
